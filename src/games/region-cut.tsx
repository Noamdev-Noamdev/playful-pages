import {
  Grid2x2Check,
  RotateCcw,
  Undo2,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Play,
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
  checkAgainstSolutions,
} from "./region-cut/logic";
import type { RegionInfo, RegionState } from "./region-cut/logic";
import type { RawRegionCutPuzzle } from "./region-cut/puzzles";
import { parsePuzzle } from "./region-cut/puzzles";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_SLUG = "region-cut";
const ROWS = 6;
const COLS = 6;
const CELL = 52; // px per cell
const TUTORIAL_ROWS = 2;
const TUTORIAL_COLS = 3;
const TUTORIAL_CELL = 52;

const TUTORIAL_GRID = [
  [1, 2, 1],
  [2, 1, 2],
];
const TUTORIAL_TARGET = 3;
const TUTORIAL_FIRST_DIVIDER = [borderKey(0, 0, 0, 1), borderKey(1, 0, 1, 1)];
const TUTORIAL_SECOND_DIVIDER = [borderKey(0, 1, 0, 2), borderKey(1, 1, 1, 2)];
const TUTORIAL_STEPS = [
  {
    title: "Step 1: Draw your first cut",
    body: "Drag down the pulsing gap to place a border. Borders split the board into separate regions.",
  },
  {
    title: "Step 2: Read the sums",
    body: "Each region shows its current total.",
  },
  {
    title: "Step 3: Finish the split",
    body: "Draw the second glowing border to break the remaining cells into another target-sized region.",
  },
  {
    title: "Step 4: Match every region",
    body: "When every region hits the target sum, the whole puzzle is solved. That is the goal on the full board too.",
  },
] as const;

const REGION_UNPROCESSED_COLOR = "var(--card-sky)";
const REGION_VALID_COLOR = "#86efac";
const REGION_INVALID_COLOR = "#fca5a5";

function getRegionFillColor(state: RegionState | undefined) {
  if (state === "valid") return REGION_VALID_COLOR;
  if (state === "invalid") return REGION_INVALID_COLOR;
  return REGION_UNPROCESSED_COLOR;
}

function getRegionLabelTone(state: RegionState | undefined) {
  if (state === "valid") {
    return {
      color: "#166534",
      borderColor: "rgba(22, 101, 52, 0.25)",
    };
  }

  if (state === "invalid") {
    return {
      color: "#b91c1c",
      borderColor: "rgba(185, 28, 28, 0.25)",
    };
  }

  return {
    color: "#1d4ed8",
    borderColor: "rgba(29, 78, 216, 0.25)",
  };
}

// ─── Edge Hit Zones ──────────────────────────────────────────────────────────

interface EdgeInfo {
  key: string;
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  dir: "h" | "v"; // h = horizontal (between rows), v = vertical (between cols)
}

function getAllEdges(rows: number, cols: number): EdgeInfo[] {
  const edges: EdgeInfo[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Right neighbor
      if (c < cols - 1) {
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
      if (r < rows - 1) {
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
const ALL_EDGES = getAllEdges(ROWS, COLS);
const TUTORIAL_EDGES = getAllEdges(TUTORIAL_ROWS, TUTORIAL_COLS);

// ─── Label Positioning Logic ────────────────────────────────────────────────

function computeRegionLabelPositions(
  regions: RegionInfo[],
  regionMap: number[][],
  rows: number,
  cols: number,
) {
  const positions = new Map<number, { pr: number; pc: number }>();
  const claimed = new Set<string>();

  const sortedRegions = [...regions].sort((a, b) => {
    if (a.cells.length !== b.cells.length) return a.cells.length - b.cells.length;
    return a.id - b.id;
  });

  for (const region of sortedRegions) {
    if (region.cells.length === 0) continue;

    let sumR = 0,
      sumC = 0;
    for (const [r, c] of region.cells) {
      sumR += r;
      sumC += c;
    }
    const exactCentR = sumR / region.cells.length + 0.5;
    const exactCentC = sumC / region.cells.length + 0.5;

    const candidates: { hr: number; hc: number; pr: number; pc: number; score: number }[] = [];

    for (let hr = 0; hr <= 2 * rows; hr++) {
      for (let hc = 0; hc <= 2 * cols; hc++) {
        if (hr % 2 !== 0 && hc % 2 !== 0) continue; // Cell center

        let cellsInRegion = 0;
        const adjacentCells: [number, number][] = [];

        if (hr % 2 === 0 && hc % 2 === 0) {
          adjacentCells.push(
            [hr / 2 - 1, hc / 2 - 1],
            [hr / 2 - 1, hc / 2],
            [hr / 2, hc / 2 - 1],
            [hr / 2, hc / 2],
          );
        } else if (hr % 2 === 0) {
          const c = Math.floor(hc / 2);
          adjacentCells.push([hr / 2 - 1, c], [hr / 2, c]);
        } else {
          const r = Math.floor(hr / 2);
          adjacentCells.push([r, hc / 2 - 1], [r, hc / 2]);
        }

        let validAdj = 0;
        for (const [ar, ac] of adjacentCells) {
          if (ar >= 0 && ar < rows && ac >= 0 && ac < cols) {
            validAdj++;
            if (regionMap[ar][ac] === region.id) {
              cellsInRegion++;
            }
          }
        }

        if (cellsInRegion > 0) {
          const pr = hr / 2;
          const pc = hc / 2;
          const distSq = Math.pow(pr - exactCentR, 2) + Math.pow(pc - exactCentC, 2);
          const isOuterBorder = hr === 0 || hr === 2 * rows || hc === 0 || hc === 2 * cols;

          let score = distSq;
          if (cellsInRegion < validAdj) score += 10;
          if (isOuterBorder) score += 5;
          if (claimed.has(`${hr},${hc}`)) score += 100;

          score += hr * 0.001 + hc * 0.0001;

          candidates.push({ hr, hc, pr, pc, score });
        }
      }
    }

    candidates.sort((a, b) => a.score - b.score);
    if (candidates.length > 0) {
      const best = candidates[0];
      positions.set(region.id, { pr: best.pr, pc: best.pc });
      claimed.add(`${best.hr},${best.hc}`);
    }
  }

  return positions;
}

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialBorders, setTutorialBorders] = useState<Set<string>>(() => new Set());

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<"add" | "remove">("add");
  const [tutorialIsDragging, setTutorialIsDragging] = useState(false);

  // ── Derived state ───────────────────────────────────────────────────────
  const { regionMap, regions } = useMemo(() => {
    return computeRegions(ROWS, COLS, borders);
  }, [borders]);

  const regionStates = useMemo(() => {
    if (!puzzle) return new Map();
    computeRegionSums(puzzle.grid, regions);
    return getRegionStates(regions, puzzle.targetSum);
  }, [puzzle, regions]);

  const { regionMap: tutorialRegionMap, regions: tutorialRegions } = useMemo(() => {
    return computeRegions(TUTORIAL_ROWS, TUTORIAL_COLS, tutorialBorders);
  }, [tutorialBorders]);

  const tutorialRegionStates = useMemo(() => {
    computeRegionSums(TUTORIAL_GRID, tutorialRegions);
    return getRegionStates(tutorialRegions, TUTORIAL_TARGET);
  }, [tutorialRegions]);

  const regionLabelPositions = useMemo(() => {
    return computeRegionLabelPositions(regions, regionMap, ROWS, COLS);
  }, [regions, regionMap]);

  const tutorialLabelPositions = useMemo(() => {
    return computeRegionLabelPositions(
      tutorialRegions,
      tutorialRegionMap,
      TUTORIAL_ROWS,
      TUTORIAL_COLS,
    );
  }, [tutorialRegions, tutorialRegionMap]);

  const solved = useMemo(() => {
    if (!puzzle) return false;
    return checkWin(regions, puzzle.targetSum);
  }, [puzzle, regions]);

  const firstTutorialDividerDone = TUTORIAL_FIRST_DIVIDER.every((edge) =>
    tutorialBorders.has(edge),
  );
  const secondTutorialDividerDone = TUTORIAL_SECOND_DIVIDER.every((edge) =>
    tutorialBorders.has(edge),
  );
  const tutorialCanAdvance =
    (tutorialStep === 0 && firstTutorialDividerDone) ||
    tutorialStep === 1 ||
    (tutorialStep === 2 && secondTutorialDividerDone) ||
    tutorialStep === 3;
  const tutorialHighlightedEdges =
    tutorialStep === 0 && !firstTutorialDividerDone
      ? new Set(TUTORIAL_FIRST_DIVIDER)
      : tutorialStep === 2 && !secondTutorialDividerDone
        ? new Set(TUTORIAL_SECOND_DIVIDER)
        : new Set<string>();

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

  useEffect(() => {
    const handlePointerUp = () => setTutorialIsDragging(false);
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  useEffect(() => {
    if (!showHelp) {
      setShowTutorial(false);
      setTutorialStep(0);
      setTutorialBorders(new Set());
      setTutorialIsDragging(false);
    }
  }, [showHelp]);

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
    const result = checkAgainstSolutions(borders, puzzle.validSolutionBorders);

    if (!result.compatible) {
      setCheckStatus({
        ok: false,
        msg: "Not quite — at least one border is in the wrong place.",
      });
      return;
    }

    if (result.exact) {
      setCheckStatus({ ok: true, msg: "Perfect — all borders are correct!" });
      return;
    }

    setCheckStatus({
      ok: true,
      msg: "So far so good — all placed borders are correct.",
    });
  }, [puzzle, borders]);

  const resetTutorial = useCallback(() => {
    setTutorialStep(0);
    setTutorialBorders(new Set());
    setTutorialIsDragging(false);
  }, []);

  const startTutorial = useCallback(() => {
    resetTutorial();
    setShowTutorial(true);
  }, [resetTutorial]);

  const completeTutorial = useCallback(() => {
    setShowTutorial(false);
    setShowHelp(false);
  }, []);

  const tutorialStepAllowedEdges = useMemo(() => {
    return tutorialStep === 0
      ? TUTORIAL_FIRST_DIVIDER
      : tutorialStep === 2
        ? TUTORIAL_SECOND_DIVIDER
        : [];
  }, [tutorialStep]);

  const handleTutorialEdgePointerDown = useCallback(
    (edgeKey: string) => {
      if (!tutorialStepAllowedEdges.includes(edgeKey)) return;
      setTutorialIsDragging(true);
      setTutorialBorders((prev) => {
        if (prev.has(edgeKey)) return prev;
        const next = new Set(prev);
        next.add(edgeKey);
        return next;
      });
    },
    [tutorialStepAllowedEdges],
  );

  const handleTutorialEdgePointerEnter = useCallback(
    (edgeKey: string) => {
      if (!tutorialIsDragging || !tutorialStepAllowedEdges.includes(edgeKey)) return;
      setTutorialBorders((prev) => {
        if (prev.has(edgeKey)) return prev;
        const next = new Set(prev);
        next.add(edgeKey);
        return next;
      });
    },
    [tutorialIsDragging, tutorialStepAllowedEdges],
  );

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
              {!showTutorial ? (
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                  <p>Draw borders between cells to divide the grid into regions.</p>
                  <p>
                    Every region must stay connected and add up to exactly the target sum shown
                    above the board.
                  </p>
                  <div>
                    <p>Controls:</p>
                    <ul className="ml-4 mt-2 list-disc space-y-1">
                      <li>
                        <span className="font-bold">Click</span> between two cells to place or
                        remove a border
                      </li>
                      <li>
                        <span className="font-bold">Click and drag</span> to draw several borders in
                        one motion
                      </li>
                    </ul>
                  </div>
                  <p>
                    Each region shows its current total. Green regions are correct, blue regions
                    still need to be split, and red regions cannot reach the target anymore.
                  </p>
                  <p className="rounded-xl border-2 border-foreground bg-card-yellow p-3 font-semibold">
                    Tip: Use Check any time to confirm whether your placed borders are correct so
                    far.
                  </p>
                  <button
                    type="button"
                    onClick={startTutorial}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-card-sky px-4 py-2 font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Play tutorial
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start justify-between gap-3 rounded-2xl border-2 border-foreground bg-background p-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {TUTORIAL_STEPS[tutorialStep].title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">
                        {TUTORIAL_STEPS[tutorialStep].body}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-foreground px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      {tutorialStep + 1}/{TUTORIAL_STEPS.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-foreground bg-card p-4">
                    <div
                      className="relative mx-auto select-none"
                      style={{
                        width: TUTORIAL_COLS * TUTORIAL_CELL,
                        height: TUTORIAL_ROWS * TUTORIAL_CELL,
                      }}
                    >
                      {Array.from({ length: TUTORIAL_ROWS }, (_, r) =>
                        Array.from({ length: TUTORIAL_COLS }, (_, c) => {
                          const regionId = tutorialRegionMap[r][c];
                          const state = tutorialRegionStates.get(regionId);
                          const bgColor = getRegionFillColor(state);

                          return (
                            <div
                              key={`tutorial-cell-${r}-${c}`}
                              className="absolute z-0 flex items-center justify-center border border-foreground/10"
                              style={{
                                left: c * TUTORIAL_CELL,
                                top: r * TUTORIAL_CELL,
                                width: TUTORIAL_CELL,
                                height: TUTORIAL_CELL,
                                backgroundColor: bgColor,
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <span className="relative z-[1] text-lg font-black text-foreground">
                                {TUTORIAL_GRID[r][c]}
                              </span>
                            </div>
                          );
                        }),
                      )}

                      {Array.from({ length: TUTORIAL_ROWS - 1 }, (_, r) => (
                        <div
                          key={`tutorial-hline-${r}`}
                          style={{
                            position: "absolute",
                            left: 0,
                            top: (r + 1) * TUTORIAL_CELL,
                            width: TUTORIAL_COLS * TUTORIAL_CELL,
                            height: 1,
                            backgroundColor: "rgba(148, 163, 184, 0.25)",
                            zIndex: 1,
                            pointerEvents: "none",
                          }}
                        />
                      ))}
                      {Array.from({ length: TUTORIAL_COLS - 1 }, (_, c) => (
                        <div
                          key={`tutorial-vline-${c}`}
                          style={{
                            position: "absolute",
                            left: (c + 1) * TUTORIAL_CELL,
                            top: 0,
                            width: 1,
                            height: TUTORIAL_ROWS * TUTORIAL_CELL,
                            backgroundColor: "rgba(148, 163, 184, 0.25)",
                            zIndex: 1,
                            pointerEvents: "none",
                          }}
                        />
                      ))}

                      {TUTORIAL_EDGES.map((edge) => {
                        if (!tutorialBorders.has(edge.key)) return null;
                        const isH = edge.dir === "h";
                        return (
                          <div
                            key={`tutorial-border-${edge.key}`}
                            className="rounded-full shadow-[1px_1px_0_0_var(--foreground)]"
                            style={{
                              position: "absolute",
                              left: isH
                                ? Math.min(edge.c1, edge.c2) * TUTORIAL_CELL
                                : (edge.c1 + 1) * TUTORIAL_CELL - 2,
                              top: isH
                                ? (edge.r1 + 1) * TUTORIAL_CELL - 2
                                : Math.min(edge.r1, edge.r2) * TUTORIAL_CELL,
                              width: isH ? TUTORIAL_CELL : 4,
                              height: isH ? 4 : TUTORIAL_CELL,
                              backgroundColor: "#1e293b",
                              borderRadius: 2,
                              zIndex: 3,
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })}

                      {TUTORIAL_EDGES.map((edge) => {
                        const isH = edge.dir === "h";
                        const hitSize = 16;
                        const highlighted = tutorialHighlightedEdges.has(edge.key);
                        return (
                          <div
                            key={`tutorial-hit-${edge.key}`}
                            className={[
                              "rc-edge-zone",
                              highlighted ? "animate-pulse bg-card-sky/50" : "",
                            ].join(" ")}
                            style={{
                              position: "absolute",
                              left: isH
                                ? Math.min(edge.c1, edge.c2) * TUTORIAL_CELL
                                : (edge.c1 + 1) * TUTORIAL_CELL - hitSize / 2,
                              top: isH
                                ? (edge.r1 + 1) * TUTORIAL_CELL - hitSize / 2
                                : Math.min(edge.r1, edge.r2) * TUTORIAL_CELL,
                              width: isH ? TUTORIAL_CELL : hitSize,
                              height: isH ? hitSize : TUTORIAL_CELL,
                              zIndex: 5,
                              touchAction: "none",
                              borderRadius: 2,
                              boxShadow: highlighted ? "0 0 0 2px rgba(30, 41, 59, 0.25)" : "none",
                            }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              handleTutorialEdgePointerDown(edge.key);
                            }}
                            onPointerEnter={() => handleTutorialEdgePointerEnter(edge.key)}
                          />
                        );
                      })}

                      {tutorialRegions.map((region) => {
                        if (region.cells.length === 0) return null;

                        const pos = tutorialLabelPositions.get(region.id);
                        if (!pos) return null;

                        const state = tutorialRegionStates.get(region.id);
                        const { color, borderColor } = getRegionLabelTone(state);

                        return (
                          <div
                            key={`tutorial-label-${region.id}`}
                            className="pointer-events-none absolute z-[4] whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.02em] shadow-sm"
                            style={{
                              left: pos.pc * TUTORIAL_CELL,
                              top: pos.pr * TUTORIAL_CELL,
                              transform: "translate(-50%, -50%)",
                              color,
                              backgroundColor: "rgba(255, 255, 255, 0.88)",
                              border: `1px solid ${borderColor}`,
                              transition: "color 0.3s ease, border-color 0.3s ease",
                            }}
                          >
                            {region.sum}
                            <span style={{ opacity: 0.5 }}> / {TUTORIAL_TARGET}</span>
                          </div>
                        );
                      })}

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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTutorial(false)}
                      className="rounded-xl border-2 border-foreground bg-background px-3 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
                    >
                      Back to text
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={resetTutorial}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-background px-3 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={() => setTutorialStep((step) => Math.max(0, step - 1))}
                        disabled={tutorialStep === 0}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-background px-3 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back
                      </button>
                      {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={completeTutorial}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-card-sky px-3 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)]"
                        >
                          Complete tutorial
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setTutorialStep((step) => Math.min(TUTORIAL_STEPS.length - 1, step + 1))
                          }
                          disabled={!tutorialCanAdvance}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-card-sky px-3 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                const bgColor = getRegionFillColor(state);

                return (
                  <div
                    key={`cell-${r}-${c}`}
                    className="absolute z-0 flex items-center justify-center border border-foreground/10"
                    style={{
                      left: c * CELL,
                      top: r * CELL,
                      width: CELL,
                      height: CELL,
                      backgroundColor: bgColor,
                      transition: "background-color 0.3s ease",
                    }}
                  >
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

            {/* Region sum labels — one per region, positioned on wall spaces */}
            {regions.map((region) => {
              if (region.cells.length === 0) return null;

              const pos = regionLabelPositions.get(region.id);
              if (!pos) return null;

              const state = regionStates.get(region.id);
              const { color, borderColor } = getRegionLabelTone(state);

              // Only show label for regions with 2+ cells (otherwise too cramped)
              if (region.cells.length < 2 && regions.length > 9) return null;

              return (
                <div
                  key={`label-${region.id}`}
                  className="pointer-events-none absolute z-[4] whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.02em] shadow-sm"
                  style={{
                    left: pos.pc * CELL,
                    top: pos.pr * CELL,
                    transform: "translate(-50%, -50%)",
                    color,
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    border: `1px solid ${borderColor}`,
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
              <span className="inline-block h-3.5 w-3.5 border-2 border-foreground bg-card-sky" />
              unprocessed region
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-3.5 border-2 border-foreground"
                style={{ backgroundColor: REGION_VALID_COLOR }}
              />
              valid region
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-3.5 border-2 border-foreground"
                style={{ backgroundColor: REGION_INVALID_COLOR }}
              />
              invalid region
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
  color: "peach",
  category: "originals",
  Component: RegionCutGame,
  dailySlug: "region-cut",
};

export default RegionCut;
