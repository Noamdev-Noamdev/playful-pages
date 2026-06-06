import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { FlaskConical, Lightbulb, Sparkles } from "lucide-react";
import { ELEMENTS, COMBINATIONS, TOTAL, combineKey } from "./elements";
import type { CanvasItem, DragState, Element } from "./types";
import { getArchiveDates, getLevelByDate, formatDate } from "@/levels";

// ─── Daily ────────────────────────────────────────────────────────────────────

const DAILY_SLUG = "build-your-own";
// Per-day key so progress resets at midnight (local time).
const STORAGE_PREFIX = "playpile:byo:discovered:";

interface DailyData {
  id: string;
  name: string;
  emoji: string;
  tier: number;
  hint: string;
  recipes: Array<[string, string]>;
}

interface DailyEntry {
  date: string;
  data: DailyData;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_W = 78;
const ITEM_H = 70;
const CANVAS_H = 420;
const COMBINE_DIST = 68; // px, centre-to-centre

const STARTING_IDS = ["fire", "water", "earth", "air"];

const STARTING_ITEMS: CanvasItem[] = [
  { instanceId: "s0", elementId: "fire", x: 28, y: 24, anim: "idle" },
  { instanceId: "s1", elementId: "water", x: 136, y: 24, anim: "idle" },
  { instanceId: "s2", elementId: "earth", x: 244, y: 24, anim: "idle" },
  { instanceId: "s3", elementId: "air", x: 352, y: 24, anim: "idle" },
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
  // ── Collect every authored daily element dated ≤ today ─────────────────────
  // The newest one is "today's target" (gets the hint + reveal-others button).
  // All earlier ones are permanently merged into the element pool so they can
  // be ingredients for future dailies.
  const { allDailies, todaysTarget } = useMemo(() => {
    const todayKey = formatDate(new Date());
    const dates = getArchiveDates(DAILY_SLUG)
      .filter((d) => d.date <= todayKey)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const entries: DailyEntry[] = [];
    for (const { date } of dates) {
      const entry = getLevelByDate<DailyData>(DAILY_SLUG, date);
      if (entry?.data) entries.push({ date: entry.date, data: entry.data });
    }
    return {
      allDailies: entries,
      todaysTarget: entries.length > 0 ? entries[entries.length - 1] : null,
    };
  }, []);

  // Merge every past+today daily element into the lookup tables.
  const mergedElements = useMemo<Record<string, Element>>(() => {
    if (allDailies.length === 0) return ELEMENTS;
    const out: Record<string, Element> = { ...ELEMENTS };
    for (const { data } of allDailies) {
      out[data.id] = {
        id: data.id,
        name: data.name,
        emoji: data.emoji,
        tier: data.tier,
      };
    }
    return out;
  }, [allDailies]);

  const mergedCombinations = useMemo<Record<string, string>>(() => {
    if (allDailies.length === 0) return COMBINATIONS;
    const out: Record<string, string> = { ...COMBINATIONS };
    for (const { data } of allDailies) {
      for (const [a, b] of data.recipes) {
        out[combineKey(a, b)] = data.id;
      }
    }
    return out;
  }, [allDailies]);

  const totalCount = TOTAL + allDailies.length;

  // ── Discovered set — resets every day (key includes today's date) ─────────
  const todayStorageKey = useMemo(() => `${STORAGE_PREFIX}${formatDate(new Date())}`, []);
  const [discovered, setDiscovered] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(STARTING_IDS);
    try {
      // Clean up old per-day keys from previous days.
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX) && k !== todayStorageKey) {
          localStorage.removeItem(k);
          i--;
        }
      }
      const raw = localStorage.getItem(todayStorageKey);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        return new Set([...STARTING_IDS, ...arr]);
      }
    } catch {
      /* ignore */
    }
    return new Set(STARTING_IDS);
  });

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(todayStorageKey, JSON.stringify([...discovered]));
    } catch {
      /* ignore */
    }
  }, [discovered, todayStorageKey]);

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(() =>
    STARTING_ITEMS.map((i) => ({ ...i })),
  );
  const [toastEl, setToastEl] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const dailyFoundRef = useRef(false);
  const allFoundRef = useRef(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const nextId = useRef(20);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sonner notifications ──────────────────────────────────────────────────
  useEffect(() => {
    if (todaysTarget && discovered.has(todaysTarget.data.id) && !dailyFoundRef.current) {
      dailyFoundRef.current = true;
      toast.success(`You found today's element! ${todaysTarget.data.emoji}`, {
        description: todaysTarget.data.name,
      });
    }
    if (discovered.size >= totalCount && totalCount > 0 && !allFoundRef.current) {
      allFoundRef.current = true;
      toast.success("All elements discovered!", {
        icon: <Sparkles className="h-4 w-4" aria-hidden />,
        description: "You've built the entire universe.",
      });
    }
  }, [discovered, todaysTarget, totalCount]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getRect = () => canvasRef.current?.getBoundingClientRect() ?? null;

  const showToast = (elementId: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastEl(elementId);
    toastTimer.current = setTimeout(() => setToastEl(null), 2200);
  };

  const clearAnim = (instanceId: string, delay = 550) => {
    setTimeout(() => {
      setCanvasItems((prev) =>
        prev.map((i) => (i.instanceId === instanceId ? { ...i, anim: "idle" } : i)),
      );
    }, delay);
  };

  // ── Drag — pointer capture on each item ──────────────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = getRect();
      if (!rect) return;

      const item = canvasItems.find((i) => i.instanceId === instanceId);
      if (!item) return;

      dragRef.current = {
        instanceId,
        ox: e.clientX - rect.left - item.x,
        oy: e.clientY - rect.top - item.y,
      };

      setCanvasItems((prev) => {
        const rest = prev.filter((i) => i.instanceId !== instanceId);
        const it = prev.find((i) => i.instanceId === instanceId)!;
        return [...rest, { ...it, anim: "idle" }];
      });
    },
    [canvasItems],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = getRect();
    if (!rect) return;

    const nx = Math.max(0, Math.min(rect.width - ITEM_W, e.clientX - rect.left - drag.ox));
    const ny = Math.max(0, Math.min(CANVAS_H - ITEM_H, e.clientY - rect.top - drag.oy));

    setCanvasItems((prev) =>
      prev.map((i) => (i.instanceId === drag.instanceId ? { ...i, x: nx, y: ny } : i)),
    );
  }, []);

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

        let target: CanvasItem | null = null;
        let best = COMBINE_DIST;
        for (const other of prev) {
          if (other.instanceId === drag.instanceId) continue;
          const dx = cx - (other.x + ITEM_W / 2);
          const dy = cy - (other.y + ITEM_H / 2);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < best) {
            best = d;
            target = other;
          }
        }

        if (!target) return prev;

        const key = combineKey(dragged.elementId, target.elementId);
        const resultId = mergedCombinations[key];

        if (!resultId) {
          const shaken = prev.map((i) =>
            i.instanceId === drag.instanceId ? { ...i, anim: "shaking" as const } : i,
          );
          clearAnim(drag.instanceId, 380);
          return shaken;
        }

        const mx = Math.max(
          0,
          Math.min((canvasRef.current?.clientWidth ?? 400) - ITEM_W, (dragged.x + target.x) / 2),
        );
        const my = Math.max(0, Math.min(CANVAS_H - ITEM_H, (dragged.y + target.y) / 2));

        const newId: string = `i${nextId.current++}`;
        const newItem: CanvasItem = {
          instanceId: newId,
          elementId: resultId,
          x: mx,
          y: my,
          anim: "appearing",
        };

        const isNew = !discovered.has(resultId);

        setTimeout(() => {
          if (isNew) {
            setDiscovered((d) => new Set([...d, resultId]));
            showToast(resultId);
          }
          clearAnim(newId, 550);
        }, 0);

        return [
          ...prev.filter(
            (i) => i.instanceId !== drag.instanceId && i.instanceId !== target!.instanceId,
          ),
          newItem,
        ];
      });
    },
    [discovered, mergedCombinations],
  );

  const onDoubleClick = useCallback((instanceId: string) => {
    setCanvasItems((prev) => prev.filter((i) => i.instanceId !== instanceId));
  }, []);

  const spawn = useCallback((elementId: string) => {
    const rect = getRect();
    const maxX = (rect?.width ?? 400) - ITEM_W - 10;
    const maxY = CANVAS_H - ITEM_H - 10;
    const id = `i${nextId.current++}`;
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

  // ── Reveal-all-except-target ──────────────────────────────────────────────
  const revealOthers = useCallback(() => {
    if (!todaysTarget) return;
    const targetId = todaysTarget.data.id;
    const all = Object.keys(mergedElements).filter((id) => id !== targetId);
    setDiscovered(new Set(all));
    toast("Inventory unlocked", {
      description: "Every element except today's target is yours. Now find it.",
    });
  }, [todaysTarget, mergedElements]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const pct = Math.round((discovered.size / totalCount) * 100);

  return (
    <div className="flex flex-col gap-4 select-none">
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

      {/* ── Daily hint / reveal controls ─────────────────────────────────── */}
      {todaysTarget && (
        <div className="rounded-2xl border-2 border-foreground bg-card px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Today's target element
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHint((s) => !s)}
                className="text-xs font-semibold border border-foreground rounded-lg px-2.5 py-1
                  hover:bg-foreground hover:text-background transition-colors"
              >
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              <button
                onClick={revealOthers}
                className="text-xs font-semibold border border-foreground rounded-lg px-2.5 py-1
                  hover:bg-foreground hover:text-background transition-colors"
              >
                Reveal others
              </button>
            </div>
          </div>
          {showHint && (
            <p className="text-sm text-foreground italic leading-snug">
              <span className="inline-flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5" aria-hidden />
                <span>{todaysTarget.data.hint}</span>
              </span>
            </p>
          )}
        </div>
      )}

      {/* ── Discovery toast (fixed, top-right) ─────────────────────────── */}
      {toastEl && mergedElements[toastEl] && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border-2
            border-foreground bg-card px-4 py-3 shadow-2xl"
          style={{ animation: "alc-appear 0.4s cubic-bezier(.34,1.56,.64,1) both" }}
        >
          <span className="text-3xl">{mergedElements[toastEl].emoji}</span>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              New Discovery!
            </p>
            <p className="font-black text-foreground">{mergedElements[toastEl].name}</p>
          </div>
        </div>
      )}

      {/* ── Progress bar + controls ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">
              {discovered.size} / {totalCount} discovered
            </span>
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
      </div>

      {/* ── Canvas + inventory side-by-side on lg+ ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Canvas column */}
        <div className="flex flex-col gap-2 min-w-0">
          <div
            ref={canvasRef}
            className="relative rounded-3xl border-2 border-foreground bg-card overflow-hidden"
            style={{ height: CANVAS_H }}
          >
            {canvasItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                <FlaskConical className="h-10 w-10 text-muted-foreground" aria-hidden />
                <p className="text-muted-foreground text-sm font-medium">
                  Click elements to add them here
                </p>
              </div>
            )}

            {canvasItems.map((item) => {
              const el = mergedElements[item.elementId];
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
                    item.anim === "shaking" ? "alc-shaking" : "",
                  ].join(" ")}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: ITEM_W,
                    height: ITEM_H,
                    touchAction: "none",
                    zIndex: item.anim === "appearing" ? 50 : 1,
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
            Drag items together to combine · Double-click to remove
          </p>
        </div>

        {/* Inventory sidebar */}
        <aside className="rounded-3xl border-2 border-foreground bg-card p-3 lg:max-h-[420px] lg:overflow-y-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Discovered elements
          </p>
          {[0, 1, 2, 3, 4, 5, 6].map((tier) => {
            const tierItems = [...discovered]
              .map((id) => mergedElements[id])
              .filter((el) => el && el.tier === tier);
            if (tierItems.length === 0) return null;

            const tierLabels = [
              "Primordial",
              "Reactions",
              "Nature",
              "Life",
              "Civilisation",
              "Technology",
              "Cosmic",
            ];

            return (
              <div key={tier} className="mb-3">
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${TIER_COLOURS[tier]}`}
                >
                  {tierLabels[tier]}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tierItems.map((el) => (
                    <button
                      key={el.id}
                      onClick={() => spawn(el.id)}
                      title={`Add ${el.name} to canvas`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-foreground bg-card
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
        </aside>
      </div>
    </div>
  );
}
