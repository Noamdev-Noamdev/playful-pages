import { useState, useRef, useCallback } from "react";
import { ELEMENTS, COMBINATIONS, TOTAL, combineKey } from "./elements";
import type { CanvasItem, DragState } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_W = 78;
const ITEM_H = 70;
const CANVAS_H = 420;
const COMBINE_DIST = 68; // px, centre-to-centre

const STARTING_IDS = ["fire", "water", "earth", "air"];

const STARTING_ITEMS: CanvasItem[] = [
  { instanceId: "s0", elementId: "fire",  x: 28,  y: 24,  anim: "idle" },
  { instanceId: "s1", elementId: "water", x: 136, y: 24,  anim: "idle" },
  { instanceId: "s2", elementId: "earth", x: 244, y: 24,  anim: "idle" },
  { instanceId: "s3", elementId: "air",   x: 352, y: 24,  anim: "idle" },
];

// Tier label colours (Tailwind-safe)
const TIER_COLOURS: Record<number, string> = {
  0: "bg-orange-100 text-orange-700",
  1: "bg-slate-100  text-slate-600",
  2: "bg-green-100  text-green-700",
  3: "bg-pink-100   text-pink-700",
  4: "bg-amber-100  text-amber-700",
  5: "bg-blue-100   text-blue-700",
  6: "bg-purple-100 text-purple-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AlchemyGame() {
  const [discovered, setDiscovered] = useState<Set<string>>(
    () => new Set(STARTING_IDS)
  );
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(
    () => STARTING_ITEMS.map((i) => ({ ...i }))
  );
  const [toast, setToast] = useState<string | null>(null);      // recently found element id
  const [isComplete, setIsComplete] = useState(false);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const dragRef    = useRef<DragState | null>(null);             // mutable, no re-render on move
  const nextId     = useRef(20);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getRect = () => canvasRef.current?.getBoundingClientRect() ?? null;

  const showToast = (elementId: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(elementId);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const clearAnim = (instanceId: string, delay = 550) => {
    setTimeout(() => {
      setCanvasItems((prev) =>
        prev.map((i) => (i.instanceId === instanceId ? { ...i, anim: "idle" } : i))
      );
    }, delay);
  };

  // ── Drag — pointer capture on each item ──────────────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = getRect();
      if (!rect) return;

      // Read item position directly from state via functional update later;
      // capture offset now from the event.
      const item = canvasItems.find((i) => i.instanceId === instanceId);
      if (!item) return;

      dragRef.current = {
        instanceId,
        ox: e.clientX - rect.left - item.x,
        oy: e.clientY - rect.top  - item.y,
      };

      // Bring dragged item to the top of the render order
      setCanvasItems((prev) => {
        const rest = prev.filter((i) => i.instanceId !== instanceId);
        const it   = prev.find((i)  => i.instanceId === instanceId)!;
        return [...rest, { ...it, anim: "idle" }];
      });
    },
    [canvasItems]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = getRect();
      if (!rect) return;

      const nx = Math.max(0, Math.min(rect.width  - ITEM_W, e.clientX - rect.left - drag.ox));
      const ny = Math.max(0, Math.min(CANVAS_H    - ITEM_H, e.clientY - rect.top  - drag.oy));

      setCanvasItems((prev) =>
        prev.map((i) =>
          i.instanceId === drag.instanceId ? { ...i, x: nx, y: ny } : i
        )
      );
    },
    []
  );

  const onPointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;

      setCanvasItems((prev) => {
        const dragged = prev.find((i) => i.instanceId === drag.instanceId);
        if (!dragged) return prev;

        const cx = dragged.x + ITEM_W / 2;
        const cy = dragged.y + ITEM_H / 2;

        // Find nearest other item within combine threshold
        let target: CanvasItem | null = null;
        let best = COMBINE_DIST;
        for (const other of prev) {
          if (other.instanceId === drag.instanceId) continue;
          const dx = cx - (other.x + ITEM_W / 2);
          const dy = cy - (other.y + ITEM_H / 2);
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < best) { best = d; target = other; }
        }

        if (!target) return prev; // no merge candidate

        const key      = combineKey(dragged.elementId, target.elementId);
        const resultId = COMBINATIONS[key];

        if (!resultId) {
          // Fail — shake the dragged item
          const shaken = prev.map((i) =>
            i.instanceId === drag.instanceId ? { ...i, anim: "shaking" as const } : i
          );
          clearAnim(drag.instanceId, 380);
          return shaken;
        }

        // Success — remove both, place result at midpoint
        const mx = Math.max(0, Math.min((canvasRef.current?.clientWidth ?? 400) - ITEM_W,
          (dragged.x + target.x) / 2));
        const my = Math.max(0, Math.min(CANVAS_H - ITEM_H,
          (dragged.y + target.y) / 2));

        const newId: string = `i${nextId.current++}`;
        const newItem: CanvasItem = {
          instanceId: newId,
          elementId:  resultId,
          x: mx, y: my,
          anim: "appearing",
        };

        const isNew = !discovered.has(resultId);

        // Schedule side-effects after render
        setTimeout(() => {
          if (isNew) {
            setDiscovered((d) => new Set([...d, resultId]));
            showToast(resultId);
            if (resultId === "universe") setIsComplete(true);
          }
          clearAnim(newId, 550);
        }, 0);

        return [
          ...prev.filter(
            (i) => i.instanceId !== drag.instanceId && i.instanceId !== target!.instanceId
          ),
          newItem,
        ];
      });
    },
    [discovered]
  );

  // ── Double-click to remove ─────────────────────────────────────────────────

  const onDoubleClick = useCallback((instanceId: string) => {
    setCanvasItems((prev) => prev.filter((i) => i.instanceId !== instanceId));
  }, []);

  // ── Spawn from inventory ───────────────────────────────────────────────────

  const spawn = useCallback((elementId: string) => {
    const rect = getRect();
    const maxX = (rect?.width  ?? 400) - ITEM_W - 10;
    const maxY = CANVAS_H - ITEM_H - 10;
    const id   = `i${nextId.current++}`;
    setCanvasItems((prev) => [
      ...prev,
      {
        instanceId: id,
        elementId,
        x: Math.floor(Math.random() * maxX + 10),
        y: Math.floor(Math.random() * maxY + 10),
        anim: "appearing",
      },
    ]);
    clearAnim(id, 550);
  }, []);

  const clearCanvas = useCallback(() => setCanvasItems([]), []);

  const resetGame = useCallback(() => {
    setDiscovered(new Set(STARTING_IDS));
    setCanvasItems(STARTING_ITEMS.map((i) => ({ ...i })));
    setIsComplete(false);
    setToast(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const pct = Math.round((discovered.size / TOTAL) * 100);

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Keyframe definitions */}
      <style>{`
        @keyframes alc-appear {
          0%   { opacity:0; transform:scale(0) rotate(-14deg); }
          65%  { opacity:1; transform:scale(1.18) rotate(4deg); }
          100% { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes alc-shake {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-7px); }
          45%     { transform:translateX(7px); }
          65%     { transform:translateX(-4px); }
          85%     { transform:translateX(4px); }
        }
        .alc-appearing { animation: alc-appear 0.48s cubic-bezier(.34,1.56,.64,1) both; }
        .alc-shaking   { animation: alc-shake  0.36s ease both; }
      `}</style>

      {/* ── Completion banner ───────────────────────────────────────────── */}
      {isComplete && (
        <div className="rounded-2xl border-2 border-foreground bg-card p-5 text-center shadow-lg">
          <p className="text-3xl mb-1">🪐</p>
          <p className="text-xl font-black text-foreground">You discovered the Universe!</p>
          <p className="text-sm text-muted-foreground mt-1">
            The full chain — from primordial fire to cosmic infinity.
          </p>
          <button
            onClick={resetGame}
            className="mt-3 px-6 py-2 rounded-xl bg-foreground text-background font-semibold text-sm
              hover:opacity-90 transition-opacity"
          >
            Start over
          </button>
        </div>
      )}

      {/* ── Discovery toast (fixed, top-right) ─────────────────────────── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border-2
            border-foreground bg-card px-4 py-3 shadow-2xl"
          style={{ animation: "alc-appear 0.4s cubic-bezier(.34,1.56,.64,1) both" }}
        >
          <span className="text-3xl">{ELEMENTS[toast].emoji}</span>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              New Discovery!
            </p>
            <p className="font-black text-foreground">{ELEMENTS[toast].name}</p>
          </div>
        </div>
      )}

      {/* ── Progress bar + controls ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">{discovered.size} / {TOTAL} discovered</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden border border-foreground">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={clearCanvas}
          className="text-xs text-muted-foreground hover:text-foreground border border-foreground
            rounded-lg px-2.5 py-1 transition-colors shrink-0"
        >
          Clear
        </button>
        <button
          onClick={resetGame}
          className="text-xs text-muted-foreground hover:text-foreground border border-foreground
            rounded-lg px-2.5 py-1 transition-colors shrink-0"
        >
          Reset
        </button>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        className="relative rounded-3xl border-2 border-foreground bg-card overflow-hidden"
        style={{ height: CANVAS_H }}
      >
        {canvasItems.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
            <p className="text-4xl">⚗️</p>
            <p className="text-muted-foreground text-sm font-medium">
              Click elements below to add them here
            </p>
          </div>
        )}

        {canvasItems.map((item) => {
          const el = ELEMENTS[item.elementId];
          if (!el) return null;
          return (
            <div
              key={item.instanceId}
              onPointerDown={(e) => onPointerDown(e, item.instanceId)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={() => onDoubleClick(item.instanceId)}
              className={[
                "absolute flex flex-col items-center justify-center gap-0.5",
                "border-2 border-foreground rounded-xl bg-card",
                "cursor-grab active:cursor-grabbing",
                "hover:shadow-lg transition-shadow",
                item.anim === "appearing" ? "alc-appearing" : "",
                item.anim === "shaking"   ? "alc-shaking"   : "",
              ].join(" ")}
              style={{
                left:        item.x,
                top:         item.y,
                width:       ITEM_W,
                height:      ITEM_H,
                touchAction: "none",
                zIndex:      item.anim === "appearing" ? 50 : 1,
              }}
            >
              <span className="text-3xl leading-none">{el.emoji}</span>
              <span className="text-[11px] font-semibold text-foreground text-center leading-tight px-1">
                {el.name}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Drag items together to combine · Double-click to remove from canvas
      </p>

      {/* ── Inventory ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Discovered elements
        </p>
        {/* Group by tier */}
        {[0, 1, 2, 3, 4, 5, 6].map((tier) => {
          const tierItems = [...discovered]
            .map((id) => ELEMENTS[id])
            .filter((el) => el && el.tier === tier);
          if (tierItems.length === 0) return null;

          const tierLabels = [
            "Primordial", "Reactions", "Nature", "Life", "Civilisation", "Technology", "Cosmic",
          ];

          return (
            <div key={tier} className="mb-3">
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${TIER_COLOURS[tier]}`}>
                {tierLabels[tier]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tierItems.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => spawn(el.id)}
                    title={`Add ${el.name} to canvas`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-foreground bg-card
                      hover:bg-foreground hover:text-background transition-colors text-xs font-semibold"
                  >
                    <span>{el.emoji}</span>
                    <span>{el.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}