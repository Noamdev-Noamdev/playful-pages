import { ArrowLeft, ArrowRight, HelpCircle, Play, Radio, RotateCcw, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Game } from "./types";
import { WinOverlay } from "./_WinOverlay";
import { getDailyLevel, getLevelByDate } from "@/levels";
import { DailyBadge } from "@/components/DailyBadge";
import { markDailyComplete } from "@/lib/dailyLock";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

const DAILY_SLUG = "signal";

type CellKind = "empty" | "constraint" | "blocked";

interface PCell {
  kind: CellKind;
  req?: number; // required coverage (constraint cells only)
}

interface Puzzle {
  id: string;
  title: string;
  hint: string;
  grid: PCell[][];
}

interface RawPuzzle {
  id: string;
  title: string;
  hint: string;
  grid: string[][];
}

const GS = 6; // grid size
const TUTORIAL_SIZE = 4;
const TUTORIAL_GRID: PCell[][] = [
  [{ kind: "empty" }, { kind: "blocked" }, { kind: "empty" }, { kind: "constraint", req: 1 }],
  [{ kind: "empty" }, { kind: "empty" }, { kind: "blocked" }, { kind: "empty" }],
  [{ kind: "blocked" }, { kind: "empty" }, { kind: "constraint", req: 2 }, { kind: "empty" }],
  [{ kind: "empty" }, { kind: "empty" }, { kind: "blocked" }, { kind: "empty" }],
];

const TUTORIAL_STEPS = [
  {
    title: "Step 1: Place a tower",
    body: "Click the pulsing empty tile. Towers can only go on empty spaces.",
  },
  {
    title: "Step 2: Follow the signal",
    body: "Signal travels up, down, left, and right. Blue tiles are being reached, and walls stop the beam immediately.",
  },
  {
    title: "Step 3: Match the numbers",
    body: "Click the second pulsing tile. The center 2 must see exactly two towers, while the 1 only needs one.",
  },
  {
    title: "Step 4: Read the board",
    body: "Green numbers are satisfied. In the full puzzle, every numbered tile must end in the correct state at the same time.",
  },
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   Parse JSON token grid → PCell grid
───────────────────────────────────────────────────────────────────────────── */

function parseToken(token: string): PCell {
  if (token === ".") return { kind: "empty" };
  if (token === "#") return { kind: "blocked" };
  const n = Number(token);
  if (Number.isFinite(n) && n >= 0 && n <= 9) {
    return { kind: "constraint", req: n };
  }
  // Unknown token → treat as empty so a typo doesn't crash the board.
  return { kind: "empty" };
}

function parsePuzzle(raw: RawPuzzle): Puzzle {
  return {
    id: raw.id,
    title: raw.title,
    hint: raw.hint,
    grid: raw.grid.map((row) => row.map(parseToken)),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Core logic
───────────────────────────────────────────────────────────────────────────── */

function makeTowersForSize(size: number): boolean[][] {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
}

function makeTowers(): boolean[][] {
  return makeTowersForSize(GS);
}

function computeCoverage(grid: PCell[][], towers: boolean[][]): number[][] {
  const size = grid.length;
  const cov = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!towers[r][c]) continue;
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as [number, number][]) {
        let nr = r + dr,
          nc = c + dc;
        while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (grid[nr][nc].kind === "blocked") break;
          cov[nr][nc]++;
          nr += dr;
          nc += dc;
        }
      }
    }
  }
  return cov;
}

function checkWin(grid: PCell[][], cov: number[][]): boolean {
  const hasConstraint = grid.some((row) => row.some((c) => c.kind === "constraint"));
  if (!hasConstraint) return false;
  return grid.every((row, r) =>
    row.every((cell, c) => cell.kind !== "constraint" || cov[r][c] === cell.req),
  );
}

function solveTowers(grid: PCell[][]): boolean[][] | null {
  const constraints: { r: number; c: number; req: number; vars: number[] }[] = [];
  const constraintIndexByCell = Array.from({ length: GS }, () => new Array<number>(GS).fill(-1));
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      const cell = grid[r][c];
      if (cell.kind !== "constraint") continue;
      const req = typeof cell.req === "number" ? cell.req : 0;
      const idx = constraints.length;
      constraints.push({ r, c, req, vars: [] });
      constraintIndexByCell[r][c] = idx;
    }
  }

  const vars: { r: number; c: number }[] = [];
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      if (grid[r][c].kind === "empty") vars.push({ r, c });
    }
  }

  const varToConstraints: number[][] = Array.from({ length: vars.length }, () => []);
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let vi = 0; vi < vars.length; vi++) {
    const { r, c } = vars[vi];
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < GS && nc >= 0 && nc < GS) {
        if (grid[nr][nc].kind === "blocked") break;
        const ci = constraintIndexByCell[nr][nc];
        if (ci !== -1) varToConstraints[vi].push(ci);
        nr += dr;
        nc += dc;
      }
    }
  }

  for (let vi = 0; vi < vars.length; vi++) {
    for (const ci of varToConstraints[vi]) constraints[ci].vars.push(vi);
  }

  const assign = new Int8Array(vars.length).fill(-1);
  const sum = new Int16Array(constraints.length);
  const unk = new Int16Array(constraints.length);
  for (let ci = 0; ci < constraints.length; ci++) {
    sum[ci] = 0;
    unk[ci] = constraints[ci].vars.length;
  }

  const feasible = (ci: number) => {
    const req = constraints[ci].req;
    const s = sum[ci];
    const u = unk[ci];
    return s <= req && req <= s + u;
  };

  const setVar = (vi: number, val: 0 | 1, stack: number[]) => {
    const cur = assign[vi];
    if (cur !== -1) return cur === val;
    assign[vi] = val;
    stack.push(vi);
    for (const ci of varToConstraints[vi]) {
      unk[ci]--;
      if (val === 1) sum[ci]++;
      if (!feasible(ci)) return false;
    }
    return true;
  };

  const rollback = (stack: number[]) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const vi = stack[i];
      const val = assign[vi];
      assign[vi] = -1;
      for (const ci of varToConstraints[vi]) {
        unk[ci]++;
        if (val === 1) sum[ci]--;
      }
    }
  };

  const propagate = (stack: number[]) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (let ci = 0; ci < constraints.length; ci++) {
        const req = constraints[ci].req;
        const s = sum[ci];
        const u = unk[ci];
        if (u === 0) continue;
        if (req === s) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 0, stack)) return false;
              changed = true;
            }
          }
        } else if (req === s + u) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 1, stack)) return false;
              changed = true;
            }
          }
        }
      }
    }
    return true;
  };

  const allSatisfied = () => {
    for (let ci = 0; ci < constraints.length; ci++) {
      if (sum[ci] !== constraints[ci].req) return false;
    }
    return true;
  };

  const pickVar = () => {
    let best = -1;
    let bestDeg = -1;
    for (let vi = 0; vi < vars.length; vi++) {
      if (assign[vi] !== -1) continue;
      const deg = varToConstraints[vi].length;
      if (deg > bestDeg) {
        bestDeg = deg;
        best = vi;
      }
    }
    return best;
  };

  for (let ci = 0; ci < constraints.length; ci++) {
    if (!feasible(ci)) return null;
  }

  let solution: Int8Array | null = null;
  let solutions = 0;
  const dfs = () => {
    if (solutions >= 2) return;

    const stack: number[] = [];
    if (!propagate(stack)) {
      rollback(stack);
      return;
    }

    if (allSatisfied()) {
      for (let vi = 0; vi < vars.length; vi++) {
        if (assign[vi] === -1) {
          rollback(stack);
          return;
        }
      }
      solutions++;
      if (solutions === 1) solution = new Int8Array(assign);
      rollback(stack);
      return;
    }

    const vi = pickVar();
    if (vi === -1) {
      rollback(stack);
      return;
    }

    {
      const s2: number[] = [];
      if (setVar(vi, 1, s2)) dfs();
      rollback(s2);
    }
    {
      const s2: number[] = [];
      if (setVar(vi, 0, s2)) dfs();
      rollback(s2);
    }

    rollback(stack);
  };

  dfs();
  if (!solution || solutions !== 1) return null;

  const towers = makeTowers();
  for (let vi = 0; vi < vars.length; vi++) {
    if (solution[vi] === 1) {
      const { r, c } = vars[vi];
      towers[r][c] = true;
    }
  }
  return towers;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Signal Game — main component
───────────────────────────────────────────────────────────────────────────── */

function SignalGame() {
  // ── Daily selection (archive playback via ?date=YYYY-MM-DD) ───────────────
  const dateParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("date");
  }, []);

  const dailyLevel = useMemo(() => {
    return dateParam
      ? getLevelByDate<RawPuzzle>(DAILY_SLUG, dateParam)
      : getDailyLevel<RawPuzzle>(DAILY_SLUG);
  }, [dateParam]);

  const isTodaysDaily = !dateParam;
  const puzzle = useMemo<Puzzle | null>(() => {
    if (!dailyLevel?.data) return null;
    return parsePuzzle(dailyLevel.data);
  }, [dailyLevel]);

  const [towers, setTowers] = useState<boolean[][]>(makeTowers);
  const [history, setHistory] = useState<boolean[][][]>([]);
  const [won, setWon] = useState(false);
  const [pulseKey, setPulseKey] = useState("");
  const [checkStatus, setCheckStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialTowers, setTutorialTowers] = useState<boolean[][]>(() =>
    makeTowersForSize(TUTORIAL_SIZE),
  );

  const coverage = useMemo(
    () => (puzzle ? computeCoverage(puzzle.grid, towers) : null),
    [puzzle, towers],
  );
  const solved = !!(puzzle && coverage && checkWin(puzzle.grid, coverage));
  const solutionTowers = useMemo(() => (puzzle ? solveTowers(puzzle.grid) : null), [puzzle]);
  const tutorialCoverage = useMemo(
    () => computeCoverage(TUTORIAL_GRID, tutorialTowers),
    [tutorialTowers],
  );
  const firstTutorialTower = tutorialTowers[2][1];
  const secondTutorialTower = tutorialTowers[2][3];
  const tutorialCanAdvance =
    (tutorialStep === 0 && firstTutorialTower) ||
    tutorialStep === 1 ||
    (tutorialStep === 2 && secondTutorialTower) ||
    tutorialStep === 3;
  const tutorialHighlight =
    tutorialStep === 0 ? "2-1" : tutorialStep === 2 && !secondTutorialTower ? "2-3" : "";

  // Delay win overlay slightly so the last satisfaction animation can play
  useEffect(() => {
    if (solved && !won) {
      const t = setTimeout(() => setWon(true), 420);
      return () => clearTimeout(t);
    }
  }, [solved, won]);

  // Lock today's daily once solved
  useEffect(() => {
    if (won && isTodaysDaily) {
      markDailyComplete(DAILY_SLUG);
    }
  }, [won, isTodaysDaily]);

  useEffect(() => {
    if (!showHelp) {
      setShowTutorial(false);
      setTutorialStep(0);
      setTutorialTowers(makeTowersForSize(TUTORIAL_SIZE));
    }
  }, [showHelp]);

  useEffect(() => {
    const hasShown = localStorage.getItem(`playpile:help-shown:${DAILY_SLUG}`);
    if (!hasShown) {
      setShowHelp(true);
      localStorage.setItem(`playpile:help-shown:${DAILY_SLUG}`, "true");
    }
  }, []);

  if (!puzzle || !coverage) {
    return (
      <div className="rounded-3xl border-2 border-foreground bg-card p-8 text-center">
        <p className="font-display text-2xl font-black">No puzzle for this date</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the archive for an available day.
        </p>
      </div>
    );
  }

  const handleClick = (r: number, c: number) => {
    if (won || puzzle.grid[r][c].kind !== "empty") return;
    const placing = !towers[r][c];
    setHistory((h) => [...h, towers.map((row) => [...row])]);
    setTowers((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
    setCheckStatus(null);
    if (placing) {
      const key = `${r}-${c}-${Date.now()}`;
      setPulseKey(key);
      setTimeout(() => setPulseKey((k) => (k === key ? "" : k)), 500);
    }
  };

  const doReset = () => {
    setHistory([]);
    setTowers(makeTowers());
    setWon(false);
    setCheckStatus(null);
  };
  const doUndo = () => {
    if (!history.length) return;
    setTowers(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setCheckStatus(null);
  };

  const doCheck = () => {
    if (!solutionTowers) {
      setCheckStatus({ ok: false, msg: "This puzzle can’t be checked right now." });
      return;
    }

    for (let r = 0; r < GS; r++) {
      for (let c = 0; c < GS; c++) {
        if (puzzle.grid[r][c].kind !== "empty") continue;
        const should = solutionTowers[r][c];
        const has = towers[r][c];
        if (has && !should) {
          setCheckStatus({
            ok: false,
            msg: "Not quite — at least one tower is in the wrong place.",
          });
          return;
        }
      }
    }

    if (solved) {
      setCheckStatus({ ok: true, msg: "Correct — all towers are in the right places." });
      return;
    }

    setCheckStatus({ ok: true, msg: "So far so good — all placed towers are correct." });
  };

  // Progress counters
  const totalConstraints = puzzle.grid.flat().filter((c) => c.kind === "constraint").length;
  const satisfiedCount = puzzle.grid.reduce(
    (acc, row, r) =>
      acc +
      row.filter((cell, c) => cell.kind === "constraint" && coverage[r][c] === cell.req).length,
    0,
  );

  const controls = [
    { label: "Reset", fn: doReset, disabled: false },
    { label: "Undo", fn: doUndo, disabled: history.length === 0 },
    { label: "Check", fn: doCheck, disabled: false },
  ];

  const resetTutorial = () => {
    setTutorialStep(0);
    setTutorialTowers(makeTowersForSize(TUTORIAL_SIZE));
  };

  const startTutorial = () => {
    resetTutorial();
    setShowTutorial(true);
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    setShowHelp(false);
  };

  const handleTutorialClick = (r: number, c: number) => {
    if (TUTORIAL_GRID[r][c].kind !== "empty") return;
    if (tutorialStep === 0 && r === 2 && c === 1) {
      setTutorialTowers((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = true;
        return next;
      });
      return;
    }
    if (tutorialStep === 2 && firstTutorialTower && r === 2 && c === 3) {
      setTutorialTowers((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = true;
        return next;
      });
    }
  };

  return (
    <>
      <style>{`
        @keyframes sig-tower-in {
          0%   { transform: scale(0); opacity: 0; }
          65%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .sig-tower-bounce {
          animation: sig-tower-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      <div className="space-y-4">
        {dailyLevel && (
          <div className="flex justify-center">
            <DailyBadge dayNumber={dailyLevel.dayNumber} date={dailyLevel.date} />
          </div>
        )}

        {/* ── Puzzle header ────────────────────────────────────────────────── */}
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
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-card text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

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
                  <p>Place signal towers on empty tiles.</p>
                  <p>
                    Each tower sends signals up, down, left, and right until the signal hits a wall
                    or reaches the edge of the board.
                  </p>
                  <div>
                    <p>Numbered tiles show how many signals they need. For example:</p>
                    <ul className="ml-4 mt-2 list-disc space-y-1">
                      <li>
                        <span className="font-bold">1</span> = must be reached by exactly 1 tower
                      </li>
                      <li>
                        <span className="font-bold">2</span> = must be reached by exactly 2 towers
                      </li>
                      <li>
                        <span className="font-bold">3</span> = must be reached by exactly 3 towers
                      </li>
                    </ul>
                  </div>
                  <p>
                    Your goal is to place towers so that every numbered tile receives exactly the
                    required number of signals.
                  </p>
                  <p className="rounded-xl border-2 border-foreground bg-card-yellow p-3 font-semibold">
                    Tip: A single tower can affect many tiles at once, so every placement matters.
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
                    <div className="mx-auto grid max-w-[224px] grid-cols-4 gap-[5px]">
                      {TUTORIAL_GRID.map((row, r) =>
                        row.map((cell, c) => (
                          <GridCell
                            key={`tutorial-${r}-${c}`}
                            cell={cell}
                            hasTower={tutorialTowers[r][c]}
                            cov={tutorialCoverage[r][c]}
                            pulsing={tutorialHighlight === `${r}-${c}`}
                            highlighted={tutorialHighlight === `${r}-${c}`}
                            onClick={() => handleTutorialClick(r, c)}
                          />
                        )),
                      )}
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
        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">
            {satisfiedCount}/{totalConstraints} satisfied
          </span>
        </div>

        {/* ── Game board ───────────────────────────────────────────────────── */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
          <div className="mx-auto grid max-w-[352px] grid-cols-6 gap-[5px]">
            {puzzle.grid.map((row, r) =>
              row.map((cell, c) => (
                <GridCell
                  key={`${r}-${c}`}
                  cell={cell}
                  hasTower={towers[r][c]}
                  cov={coverage[r][c]}
                  pulsing={towers[r][c] && pulseKey.startsWith(`${r}-${c}-`)}
                  onClick={() => handleClick(r, c)}
                />
              )),
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground bg-card-sky" />
              click to place
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-foreground/30 bg-muted text-[10px] font-black">
                ×
              </span>
              blocks signal
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded border-2 border-foreground bg-card-mint" />
              satisfied
            </span>
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-2">
          {controls.map(({ label, fn, disabled }) => (
            <button
              key={label}
              className="rounded-xl border-2 border-foreground bg-card px-4 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={fn}
              disabled={disabled}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
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

        {/* ── Win overlay (no "play again" — one daily per day) ────────────── */}
        <WinOverlay
          show={won}
          onPlayAgain={doReset}
          message="Signal Complete!"
          sub={
            isTodaysDaily
              ? "Come back tomorrow for a new puzzle, or replay past days from the archive."
              : "Replay another day from the archive."
          }
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCell component
───────────────────────────────────────────────────────────────────────────── */

interface GridCellProps {
  cell: PCell;
  hasTower: boolean;
  cov: number;
  pulsing: boolean;
  highlighted?: boolean;
  onClick: () => void;
}

function GridCell({ cell, hasTower, cov, pulsing, highlighted = false, onClick }: GridCellProps) {
  const { kind, req } = cell;

  const satisfied = kind === "constraint" && cov === req;
  const over = kind === "constraint" && typeof req === "number" && cov > req;
  const partial = kind === "constraint" && cov > 0 && !satisfied && !over;
  const uncovered = kind === "constraint" && cov === 0;
  const beamed = kind === "empty" && !hasTower && cov > 0;

  const cellClassName = [
    "sig-grid-cell relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 border-foreground/20 bg-background transition-colors select-none",
    kind === "empty" ? "cursor-pointer hover:border-foreground/60" : "cursor-default",
    kind === "blocked" ? "bg-muted text-muted-foreground" : "",
    kind === "constraint" ? "bg-card" : "",
    beamed ? "bg-card-sky" : "",
    hasTower ? "bg-card-sky border-foreground shadow-[2px_2px_0_0_var(--foreground)]" : "",
    satisfied ? "bg-card-mint border-foreground" : "",
    over ? "bg-card-coral border-foreground" : "",
    partial ? "bg-card-yellow border-foreground" : "",
    highlighted ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const numClassName = satisfied
    ? "text-foreground"
    : over
      ? "text-red-700"
      : partial
        ? "text-amber-700"
        : uncovered
          ? "text-muted-foreground"
          : "text-muted-foreground";

  return (
    <div className={cellClassName} onClick={onClick}>
      {/* Blocked × */}
      {kind === "blocked" && (
        <span className="text-base font-black leading-none opacity-60">×</span>
      )}

      {/* Tower dot */}
      {hasTower && (
        <div
          aria-hidden="true"
          className={[
            pulsing ? "sig-tower-bounce" : "",
            "h-6 w-6 rounded-full border-2 border-foreground bg-background shadow-sm",
          ].join(" ")}
        />
      )}

      {/* Constraint number */}
      {kind === "constraint" && !hasTower && (
        <div className="flex flex-col items-center gap-0.5 leading-none">
          <span className={`text-xl font-extrabold tracking-[-0.02em] ${numClassName}`}>{req}</span>
          {/* Show actual coverage below when wrong and non-zero */}
          {(partial || over) && (
            <span className={`text-[10px] font-bold opacity-70 ${numClassName}`}>{cov}</span>
          )}
        </div>
      )}

      {/* Tiny beam-coverage count on empty covered cells */}
      {beamed && (
        <span className="pointer-events-none absolute bottom-0.5 right-1 font-mono text-[10px] text-muted-foreground/70">
          {cov}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Game registration
───────────────────────────────────────────────────────────────────────────── */

const SignalMeta: Game = {
  slug: "signal",
  title: "Signal",
  description: "Place towers to route exact signal counts through every numbered cell.",
  icon: Radio,
  color: "sky",
  category: "originals",
  Component: SignalGame,
  dailySlug: "signal",
};

export default SignalMeta;
