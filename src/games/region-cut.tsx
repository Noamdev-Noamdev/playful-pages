import {
  Grid2x2Check,
  RotateCcw,
  Undo2,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Game } from "./types";
import { WinOverlay } from "./_WinOverlay";
import { getDailyLevel, getLevelByDate } from "@/levels";
import { DailyBadge } from "@/components/DailyBadge";
import { markDailyComplete } from "@/lib/dailyLock";
import {
  borderKey,
  computeRegions,
  computeRegionSums,
  getRegionStates,
  checkWin,
  checkAgainstSolution,
} from "./region-cut/logic";
import type { RawRegionCutPuzzle } from "./region-cut/puzzles";
import { parsePuzzle } from "./region-cut/puzzles";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_SLUG = "region-cut";
const ROWS = 6;
const COLS = 6;
const CELL = 52; // px per cell

// Pastel palette aligned with the main Playpile card colors
const REGION_COLORS = [
  "var(--card-sky)",
  "var(--card-yellow)",
  "var(--card-mint)",
  "var(--card-lilac)",
  "var(--card-peach)",
  "var(--card-sky)",
  "var(--card-yellow)",
  "var(--card-mint)",
];

// ─── Edge Hit Zones ──────────────────────────────────────────────────────────

interface EdgeInfo {
  key: string;
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  dir: "h" | "v"; // h = horizontal (between rows), v = vertical (between cols)
}

function getAllEdges(): EdgeInfo[] {
  const edges: EdgeInfo[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Right neighbor
      if (c < COLS - 1) {
        edges.push({
          key: borderKey(r, c, r, c + 1),
          r1: r,
          c1: c,
          r2: r,
          c2: c + 1,
          dir: "v",
        });
      }
      // Bottom neighbor
      if (r < ROWS - 1) {
        edges.push({
          key: borderKey(r, c, r + 1, c),
          r1: r,
          c1: c,
          r2: r + 1,
          c2: c,
          dir: "h",
        });
      }
    }
  }
  return edges;
}

const ALL_EDGES = getAllEdges();

// ─── Component ────────────────────────────────────────────────────────────────

function RegionCutGame() {
  // ── Daily level loading ─────────────────────────────────────────────────
  const dateParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("date");
  }, []);

  const dailyLevel = useMemo(() => {
    return dateParam
      ? getLevelByDate<RawRegionCutPuzzle>(DAILY_SLUG, dateParam)
      : getDailyLevel<RawRegionCutPuzzle>(DAILY_SLUG);
  }, [dateParam]);

  const isTodaysDaily = !dateParam;

  const puzzle = useMemo(() => {
    if (!dailyLevel?.data) return null;
    return parsePuzzle(dailyLevel.data);
  }, [dailyLevel]);

  // ── Game state ──────────────────────────────────────────────────────────
  const [borders, setBorders] = useState<Set<string>>(() => new Set());
  const [history, setHistory] = useState<Set<string>[]>([]);
  const [won, setWon] = useState(false);
  const [checkStatus, setCheckStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<"add" | "remove">("add");

  // ── Derived state ───────────────────────────────────────────────────────
  const { regionMap, regions } = useMemo(() => {
    return computeRegions(ROWS, COLS, borders);
  }, [borders]);

  const regionStates = useMemo(() => {
    if (!puzzle) return new Map();
    computeRegionSums(puzzle.grid, regions);
    return getRegionStates(regions, puzzle.targetSum);
  }, [puzzle, regions]);

  const solved = useMemo(() => {
    if (!puzzle) return false;
    return checkWin(regions, puzzle.targetSum);
  }, [puzzle, regions]);

  // Delay win overlay
  useEffect(() => {
    if (solved && !won) {
      const t = setTimeout(() => setWon(true), 500);
      return () => clearTimeout(t);
    }
  }, [solved, won]);

  // Lock daily once solved
  useEffect(() => {
    if (won && isTodaysDaily) {
      markDailyComplete(DAILY_SLUG);
    }
  }, [won, isTodaysDaily]);

  // ── Edge toggle logic ──────────────────────────────────────────────────
  const toggleEdge = useCallback(
    (edgeKey: string, mode?: "add" | "remove") => {
      if (won) return;
      setBorders((prev) => {
        const next = new Set(prev);
        const shouldAdd = mode ? mode === "add" : !prev.has(edgeKey);
        if (shouldAdd) {
          next.add(edgeKey);
        } else {
          next.delete(edgeKey);
        }
        return next;
      });
      setCheckStatus(null);
    },
    [won],
  );

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h, new Set(borders)]);
  }, [borders]);

  const handleEdgePointerDown = useCallback(
    (edgeKey: string) => {
      if (won) return;
      pushHistory();
      const mode = borders.has(edgeKey) ? "remove" : "add";
      dragModeRef.current = mode;
      setIsDragging(true);
      toggleEdge(edgeKey, mode);
    },
    [won, borders, pushHistory, toggleEdge],
  );

  const handleEdgePointerEnter = useCallback(
    (edgeKey: string) => {
      if (!isDragging || won) return;
      toggleEdge(edgeKey, dragModeRef.current);
    },
    [isDragging, won, toggleEdge],
  );

  useEffect(() => {
    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────
  const doReset = useCallback(() => {
    setHistory([]);
    setBorders(new Set());
    setWon(false);
    setCheckStatus(null);
  }, []);

  const doUndo = useCallback(() => {
    if (!history.length) return;
    setBorders(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setCheckStatus(null);
  }, [history]);

  const doCheck = useCallback(() => {
    if (!puzzle) return;
    const result = checkAgainstSolution(borders, puzzle.solutionBorders);

    if (result.wrong.length > 0) {
      setCheckStatus({
        ok: false,
        msg: "Not quite — at least one border is in the wrong place.",
      });
      return;
    }

    if (result.missing.length === 0) {
      setCheckStatus({ ok: true, msg: "Perfect — all borders are correct!" });
      return;
    }

    setCheckStatus({
      ok: true,
      msg: "So far so good — all placed borders are correct.",
    });
  }, [puzzle, borders]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (!puzzle) {
    return (
      <div className="rounded-3xl border-2 border-foreground bg-card p-8 text-center">
        <p className="font-display text-2xl font-black">No puzzle for this date</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the archive for an available day.
        </p>
      </div>
    );
  }

  // Grid dimensions including edge hit zones
  const gridW = COLS * CELL;
  const gridH = ROWS * CELL;

  // Progress
  const validCount = Array.from(regionStates.values()).filter((s) => s === "valid").length;
  const totalRegions = regions.length;

  const difficultyColor =
    puzzle.difficulty === "easy"
      ? "bg-card-mint"
      : puzzle.difficulty === "medium"
        ? "bg-card-yellow"
        : "bg-card-coral";

  return (
    <>
      <style>{`
        @keyframes rc-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(52, 211, 153, 0.3); }
          50%      { box-shadow: 0 0 16px 4px rgba(52, 211, 153, 0.5); }
        }
        .rc-valid-glow {
          animation: rc-glow 2s ease-in-out infinite;
        }
        @keyframes rc-border-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .rc-edge-zone {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .rc-edge-zone:hover {
          background-color: rgba(99, 102, 241, 0.15);
        }
      `}</style>

      <div className="space-y-5">
        {dailyLevel && (
          <div className="flex justify-center">
            <DailyBadge dayNumber={dailyLevel.dayNumber} date={dailyLevel.date} />
          </div>
        )}

        {/* ── Puzzle header ────────────────────────────────────────── */}
        <div className="relative px-12 text-center sm:px-28">
          {!isTodaysDaily && (
            <a
              href={`/play/${DAILY_SLUG}`}
              aria-label="Back to today"
              className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-background text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className="hidden text-[11px] font-black uppercase tracking-wide sm:inline">
                Back to today
              </span>
            </a>
          )}
          <p className="font-display text-2xl font-extrabold leading-tight text-foreground">
            {puzzle.title}
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {puzzle.hint}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border-2 border-foreground px-3 py-1 text-[11px] font-black uppercase tracking-wide text-foreground ${difficultyColor}`}
            >
              {puzzle.difficulty}
            </span>
            <span className="inline-flex items-center rounded-full border-2 border-foreground bg-background px-3 py-1 text-[11px] font-black uppercase tracking-wide text-foreground">
              Target {puzzle.targetSum}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-card text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* ── Help modal ──────────────────────────────────────────── */}
        {showHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--foreground)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close"
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground bg-background text-foreground hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--foreground)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="font-display text-2xl font-black text-foreground">How to Play</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                <p>
                  Draw borders between cells to divide the grid into <strong>regions</strong>.
                </p>
                <p>
                  Each region must be a connected group of cells whose numbers add up to the{" "}
                  <strong>target sum</strong>.
                </p>
                <div>
                  <p>Controls:</p>
                  <ul className="ml-4 mt-2 list-disc space-y-1">
                    <li>
                      <strong>Click</strong> between two cells to place or remove a border
                    </li>
                    <li>
                      <strong>Click and drag</strong> to draw or erase multiple borders at once
                    </li>
                  </ul>
                </div>
                <p>
                  Regions show their current sum. When a region matches the target, it glows{" "}
                  <span className="font-bold text-emerald-600">green</span>.
                </p>
                <p className="rounded-xl border-2 border-foreground bg-card-yellow p-3 font-semibold">
                  Tip: Use the Check button to verify your progress — it will tell you if any placed
                  borders are wrong.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Progress ────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3">
          <span className="rounded-full border-2 border-foreground bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
            {validCount}/{totalRegions} regions valid
          </span>
        </div>

        {/* ── Game board ──────────────────────────────────────────── */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
          <div
            className="relative mx-auto select-none"
            style={{ width: gridW, height: gridH }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Cell backgrounds with region coloring */}
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const regionId = regionMap[r][c];
                const state = regionStates.get(regionId);
                const bgColor = REGION_COLORS[regionId % REGION_COLORS.length];

                let overlayColor = "transparent";
                if (state === "valid") overlayColor = "rgba(52, 211, 153, 0.15)";
                else if (state === "over") overlayColor = "rgba(239, 68, 68, 0.1)";

                return (
                  <div
                    key={`cell-${r}-${c}`}
                    className={[
                      "absolute z-0 flex items-center justify-center border border-foreground/10",
                      state === "valid" ? "rc-valid-glow" : "",
                    ].join(" ")}
                    style={{
                      left: c * CELL,
                      top: r * CELL,
                      width: CELL,
                      height: CELL,
                      backgroundColor: bgColor,
                      transition: "background-color 0.3s ease",
                    }}
                  >
                    {/* Overlay for valid/over state */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: overlayColor,
                        transition: "background-color 0.4s ease",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Cell number */}
                    <span className="relative z-[1] text-lg font-black text-foreground sm:text-xl">
                      {puzzle.grid[r][c]}
                    </span>
                  </div>
                );
              }),
            )}

            {/* Subtle grid lines */}
            {Array.from({ length: ROWS - 1 }, (_, r) => (
              <div
                key={`hline-${r}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: (r + 1) * CELL,
                  width: gridW,
                  height: 1,
                  backgroundColor: "rgba(148, 163, 184, 0.25)",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
            ))}
            {Array.from({ length: COLS - 1 }, (_, c) => (
              <div
                key={`vline-${c}`}
                style={{
                  position: "absolute",
                  left: (c + 1) * CELL,
                  top: 0,
                  width: 1,
                  height: gridH,
                  backgroundColor: "rgba(148, 163, 184, 0.25)",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Drawn borders */}
            {ALL_EDGES.map((edge) => {
              if (!borders.has(edge.key)) return null;
              const isH = edge.dir === "h";
              return (
                <div
                  key={`border-${edge.key}`}
                  className="rounded-full shadow-[1px_1px_0_0_var(--foreground)]"
                  style={{
                    position: "absolute",
                    left: isH ? Math.min(edge.c1, edge.c2) * CELL : (edge.c1 + 1) * CELL - 2,
                    top: isH ? (edge.r1 + 1) * CELL - 2 : Math.min(edge.r1, edge.r2) * CELL,
                    width: isH ? CELL : 4,
                    height: isH ? 4 : CELL,
                    backgroundColor: "#1e293b",
                    borderRadius: 2,
                    zIndex: 3,
                    pointerEvents: "none",
                    transition: "opacity 0.15s ease",
                  }}
                />
              );
            })}

            {/* Edge hit zones (invisible, on top) */}
            {ALL_EDGES.map((edge) => {
              const isH = edge.dir === "h";
              const hitSize = 16;
              return (
                <div
                  key={`hit-${edge.key}`}
                  className="rc-edge-zone"
                  style={{
                    position: "absolute",
                    left: isH
                      ? Math.min(edge.c1, edge.c2) * CELL
                      : (edge.c1 + 1) * CELL - hitSize / 2,
                    top: isH
                      ? (edge.r1 + 1) * CELL - hitSize / 2
                      : Math.min(edge.r1, edge.r2) * CELL,
                    width: isH ? CELL : hitSize,
                    height: isH ? hitSize : CELL,
                    zIndex: 5,
                    touchAction: "none",
                    borderRadius: 2,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleEdgePointerDown(edge.key);
                  }}
                  onPointerEnter={() => handleEdgePointerEnter(edge.key)}
                />
              );
            })}

            {/* Region sum labels — one per region, positioned at centroid */}
            {regions.map((region) => {
              if (region.cells.length === 0) return null;
              // Find centroid
              let sumR = 0,
                sumC = 0;
              for (const [r, c] of region.cells) {
                sumR += r;
                sumC += c;
              }
              const centR = sumR / region.cells.length;
              const centC = sumC / region.cells.length;

              const state = regionStates.get(region.id);
              const color =
                state === "valid" ? "#059669" : state === "over" ? "#dc2626" : "#64748b";

              // Only show label for regions with 2+ cells (otherwise too cramped)
              if (region.cells.length < 2 && regions.length > 9) return null;

              return (
                <div
                  key={`label-${region.id}`}
                  className="pointer-events-none absolute z-[4] whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.02em] shadow-sm"
                  style={{
                    left: (centC + 0.5) * CELL,
                    top: (centR + 0.5) * CELL,
                    transform: "translate(-50%, -50%)",
                    color,
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    border: `1px solid ${state === "valid" ? "rgba(5, 150, 105, 0.3)" : state === "over" ? "rgba(220, 38, 38, 0.3)" : "rgba(148, 163, 184, 0.3)"}`,
                    transition: "color 0.3s ease, border-color 0.3s ease",
                  }}
                >
                  {region.sum}
                  <span style={{ opacity: 0.5 }}> / {puzzle.targetSum}</span>
                </div>
              );
            })}

            {/* Outer border */}
            <div
              style={{
                position: "absolute",
                inset: -2,
                border: "3px solid #1e293b",
                pointerEvents: "none",
                zIndex: 6,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground bg-card-sky" />
              drag to draw borders
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 border-2 border-foreground bg-card-mint" />
              valid region
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 border-2 border-foreground bg-card-coral" />
              over target
            </span>
          </div>
        </div>

        {/* ── Controls ────────────────────────────────────────────── */}
        <div className="flex justify-center gap-2">
          {[
            { label: "Reset", icon: RotateCcw, fn: doReset, disabled: false },
            { label: "Undo", icon: Undo2, fn: doUndo, disabled: history.length === 0 },
            { label: "Check", icon: CheckCircle2, fn: doCheck, disabled: false },
          ].map(({ label, icon: Icon, fn, disabled }) => (
            <button
              key={label}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-card px-4 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={fn}
              disabled={disabled}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Check status feedback ───────────────────────────────── */}
        {checkStatus && (
          <div className="flex justify-center">
            <div
              aria-live="polite"
              className={[
                "rounded-2xl border-2 border-foreground px-4 py-2 text-sm font-semibold",
                checkStatus.ok ? "bg-card-mint text-foreground" : "bg-card-coral text-foreground",
              ].join(" ")}
            >
              {checkStatus.msg}
            </div>
          </div>
        )}

        {/* ── Win overlay ─────────────────────────────────────────── */}
        <WinOverlay
          show={won}
          onPlayAgain={doReset}
          message="Region Cut Complete!"
          sub={
            isTodaysDaily
              ? "You nailed today's puzzle — come back tomorrow for a new one!"
              : `Day #${dailyLevel?.dayNumber ?? ""} conquered!`
          }
          archiveSlug={DAILY_SLUG}
        />
      </div>
    </>
  );
}

// ─── Game Registration ────────────────────────────────────────────────────────

const RegionCut: Game = {
  slug: "region-cut",
  title: "Region Cut",
  description: "Draw borders to split the grid into regions that each hit the target sum.",
  icon: Grid2x2Check,
  color: "sky",
  category: "originals",
  Component: RegionCutGame,
  dailySlug: "region-cut",
};

export default RegionCut;
