import { useState, useRef, useCallback, useEffect } from "react";
import { WinOverlay } from "../_WinOverlay";
import { getRandomPuzzle } from "./puzzles";
import type { Puzzle, PuzzleItem } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_H      = 64;   // px — height of each card
const CARD_GAP    = 10;   // px — gap between cards
const CARD_STRIDE = CARD_H + CARD_GAP;
const REVEAL_MS   = 380;  // ms per card during reveal
const CORRECT_MS  = 520;  // ms for correction slide animation

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFF_STYLES: Record<string, string> = {
  easy:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100   text-amber-700   border-amber-200",
  hard:   "bg-red-100     text-red-700     border-red-200",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "playing" | "revealing" | "done";

interface RankedItem extends PuzzleItem {
  uid: string;      // stable identity across reorders
}

interface RevealState {
  index: number;          // which card is currently being revealed
  results: ("correct" | "wrong" | null)[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildItems(puzzle: Puzzle): RankedItem[] {
  return shuffleArray(
    puzzle.items.map((item, i) => ({ ...item, uid: `${puzzle.id}-${i}` }))
  );
}

function scoreItems(userOrder: RankedItem[]): ("correct" | "wrong")[] {
  const sorted = [...userOrder].sort((a, b) => a.value - b.value);
  return userOrder.map((item, i) => (item.uid === sorted[i].uid ? "correct" : "wrong"));
}

function buildShareText(puzzle: Puzzle, results: ("correct" | "wrong" | null)[]): string {
  const emojis = results.map((r) => (r === "correct" ? "🟩" : "🟥")).join("");
  const score = results.filter((r) => r === "correct").length;
  return `RankAnything — ${puzzle.prompt}\n${emojis}\nScore: ${score}/${puzzle.items.length}`;
}

// ─── DragState ────────────────────────────────────────────────────────────────

interface DragState {
  uid:        string;
  startY:     number;   // pointer Y when drag began
  currentY:   number;   // current pointer Y
  originIdx:  number;   // index in list when drag started
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RankGame() {
  const [puzzle,  setPuzzle]  = useState<Puzzle>(() => getRandomPuzzle());
  const [items,   setItems]   = useState<RankedItem[]>(() => buildItems(puzzle));
  const [phase,   setPhase]   = useState<Phase>("playing");
  const [reveal,  setReveal]  = useState<RevealState>({ index: -1, results: [] });
  const [correctedOrder, setCorrectedOrder] = useState<RankedItem[]>([]);
  const [score,   setScore]   = useState(0);
  const [copied,  setCopied]  = useState(false);
  const [won,     setWon]     = useState(false);
  const [drag,    setDrag]    = useState<DragState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef     = useRef(items);
  itemsRef.current   = items;

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback((excludeId?: number) => {
    const next = getRandomPuzzle(excludeId);
    const nextItems = buildItems(next);
    setPuzzle(next);
    setItems(nextItems);
    setPhase("playing");
    setReveal({ index: -1, results: [] });
    setCorrectedOrder([]);
    setScore(0);
    setCopied(false);
    setWon(false);
    setDrag(null);
  }, []);

  // ── Drag: pointer events ───────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent, uid: string) => {
    if (phase !== "playing") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const idx = itemsRef.current.findIndex((it) => it.uid === uid);
    setDrag({ uid, startY: e.clientY, currentY: e.clientY, originIdx: idx });
  }, [phase]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    const newY = e.clientY;
    setDrag((d) => d ? { ...d, currentY: newY } : null);

    // Reorder list based on drag position
    const delta   = newY - drag.startY;
    const newIdx  = Math.max(0, Math.min(
      itemsRef.current.length - 1,
      drag.originIdx + Math.round(delta / CARD_STRIDE)
    ));

    setItems((prev) => {
      const oldIdx = prev.findIndex((it) => it.uid === drag.uid);
      if (oldIdx === newIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIdx, 1);
      next.splice(newIdx, 0, moved);
      return next;
    });
  }, [drag]);

  const onPointerUp = useCallback(() => {
    setDrag(null);
  }, []);

  // ── Check ──────────────────────────────────────────────────────────────────

  const handleCheck = useCallback(() => {
    if (phase !== "playing") return;
    const results = scoreItems(items);
    const sc = results.filter((r) => r === "correct").length;
    setScore(sc);
    setPhase("revealing");
    setReveal({ index: 0, results: new Array(items.length).fill(null) });

    // Sequential reveal
    results.forEach((_, i) => {
      setTimeout(() => {
        setReveal((prev) => {
          const next = [...prev.results];
          next[i] = results[i];
          return { index: i + 1, results: next };
        });

        // After last reveal → start correction
        if (i === results.length - 1) {
          setTimeout(() => {
            const sorted = [...items].sort((a, b) => a.value - b.value);
            setCorrectedOrder(sorted);
            setTimeout(() => {
              setPhase("done");
              if (sc === items.length) setWon(true);
            }, CORRECT_MS + 100);
          }, REVEAL_MS);
        }
      }, i * REVEAL_MS);
    });
  }, [phase, items]);

  // ── Share ──────────────────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    const text = buildShareText(puzzle, reveal.results);
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [puzzle, reveal.results]);

  // ── Compute visual positions ───────────────────────────────────────────────
  // Each card is positioned absolutely. We compute a target Y for every card,
  // then the dragged card gets an extra offset.

  const totalH = items.length * CARD_STRIDE - CARD_GAP;

  // Which list to read for final corrected positions
  const displayItems = correctedOrder.length > 0 ? correctedOrder : items;

  // Map uid → index in corrected order (for slide animation)
  const correctedIdxMap = new Map(correctedOrder.map((it, i) => [it.uid, i]));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6 py-4 select-none">
      <WinOverlay
        show={won}
        onPlayAgain={() => { setWon(false); reset(puzzle.id); }}
        message="Perfect score! 🎯"
        sub="Every item in exactly the right place."
      />

      {/* Prompt */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
          <span>{puzzle.promptEmoji}</span>
          <span>{puzzle.prompt}</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          {puzzle.metric}
        </p>
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${DIFF_STYLES[puzzle.difficulty]}`}>
          {puzzle.difficulty}
        </span>
      </div>

      {/* Drag arena */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md"
        style={{ height: totalH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {items.map((item, visualIdx) => {
          const isDragging  = drag?.uid === item.uid;
          const result      = reveal.results[visualIdx] ?? null;

          // During correction phase: slide from current position to corrected position
          const targetIdx   = correctedOrder.length > 0
            ? (correctedIdxMap.get(item.uid) ?? visualIdx)
            : visualIdx;
          const baseY       = targetIdx * CARD_STRIDE;

          // Drag offset: only on the dragged card, clamped to container
          let dragOffset = 0;
          if (isDragging && drag) {
            const raw = drag.currentY - drag.startY;
            const min = -drag.originIdx * CARD_STRIDE;
            const max = (items.length - 1 - drag.originIdx) * CARD_STRIDE;
            dragOffset = Math.max(min, Math.min(max, raw));
            // Snap to the visual slot (handled via setItems), keep a smooth feel
            dragOffset = drag.currentY - drag.startY - Math.round((drag.currentY - drag.startY) / CARD_STRIDE) * CARD_STRIDE + Math.round((drag.currentY - drag.startY) / CARD_STRIDE) * CARD_STRIDE;
            dragOffset = drag.currentY - drag.startY;
            dragOffset = Math.max(min, Math.min(max, dragOffset));
          }

          // Card background based on result
          let cardBg = "bg-card border-foreground";
          if (result === "correct") cardBg = "bg-emerald-50 border-emerald-400";
          if (result === "wrong")   cardBg = "bg-red-50    border-red-400";

          // Transition: smooth for correction slide, instant during drag
          const transition = isDragging
            ? "box-shadow 0.15s"
            : correctedOrder.length > 0
            ? `transform ${CORRECT_MS}ms cubic-bezier(0.4,0,0.2,1), background-color 0.3s, border-color 0.3s`
            : "transform 0.12s ease, background-color 0.3s, border-color 0.3s";

          return (
            <div
              key={item.uid}
              onPointerDown={(e) => onPointerDown(e, item.uid)}
              style={{
                position:  "absolute",
                left:      0,
                right:     0,
                top:       0,
                height:    CARD_H,
                transform: `translateY(${baseY + dragOffset}px) scale(${isDragging ? 1.035 : 1})`,
                transition,
                zIndex:    isDragging ? 10 : 1,
                touchAction: "none",
                cursor:    phase === "playing" ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              className={`
                border-2 rounded-2xl px-4 flex items-center gap-3 w-full
                ${cardBg}
                ${isDragging ? "shadow-2xl" : "shadow-sm"}
              `}
            >
              {/* Rank number */}
              <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                {visualIdx + 1}
              </span>

              {/* Drag handle */}
              {phase === "playing" && (
                <span className="text-muted-foreground opacity-40 shrink-0 text-base leading-none select-none">
                  ⠿
                </span>
              )}

              {/* Emoji */}
              <span className="text-2xl shrink-0">{item.emoji}</span>

              {/* Name + fact */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight truncate">
                  {item.name}
                </p>
                {result !== null && (
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    {item.fact}
                  </p>
                )}
              </div>

              {/* Result badge */}
              {result !== null && (
                <span className="shrink-0 text-lg">
                  {result === "correct" ? "✅" : "❌"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Check button (playing phase only) */}
      {phase === "playing" && (
        <button
          onClick={handleCheck}
          className="mt-2 px-10 py-3 rounded-2xl bg-foreground text-background font-bold text-base
            hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          Check ✓
        </button>
      )}

      {/* Score + actions (done phase) */}
      {phase === "done" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* Score card */}
          <div className="rounded-2xl border-2 border-foreground bg-card px-8 py-5 text-center w-full shadow-sm">
            <p className="text-4xl font-black text-foreground">
              {score} / {puzzle.items.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {score === puzzle.items.length
                ? "🎯 Perfect — you nailed every one!"
                : score >= puzzle.items.length - 1
                ? "🔥 So close — nearly perfect!"
                : score >= Math.ceil(puzzle.items.length / 2)
                ? "👍 Decent intuition!"
                : "🤔 Trickier than it looks, right?"}
            </p>

            {/* Share row */}
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-xl border-2 border-foreground text-sm font-semibold
                  bg-background hover:bg-foreground hover:text-background transition-colors"
              >
                {copied ? "Copied! ✓" : "📋 Share result"}
              </button>
            </div>
          </div>

          {/* Play again */}
          <button
            onClick={() => reset(puzzle.id)}
            className="px-10 py-3 rounded-2xl bg-foreground text-background font-bold text-base
              hover:opacity-90 active:scale-95 transition-all shadow-md w-full"
          >
            Next puzzle →
          </button>
        </div>
      )}

      {/* Hint during revealing */}
      {phase === "revealing" && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Revealing…
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Drag the cards into order, then hit <strong>Check</strong>
      </p>
    </div>
  );
}