import { Radio } from "lucide-react";
import { useState, useEffect } from "react";
import type { Game } from "./types";
import { WinOverlay } from "./_WinOverlay";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

type CellKind = "empty" | "constraint" | "blocked";

interface PCell {
  kind: CellKind;
  req?: number; // required coverage (constraint cells only)
}

interface Puzzle {
  id: number;
  title: string;
  hint: string;
  grid: PCell[][];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Cell factories (shorthand for puzzle definitions)
───────────────────────────────────────────────────────────────────────────── */

const E = (): PCell => ({ kind: "empty" });
const B = (): PCell => ({ kind: "blocked" });
const N = (n: number): PCell => ({ kind: "constraint", req: n });

const GS = 6; // grid size

/* ─────────────────────────────────────────────────────────────────────────────
   Puzzle definitions
   Each solution is verified by hand (solutions shown in comments only).

   Signal rule: a tower at (r,c) emits in all 4 cardinal directions; the beam
   travels until it hits a BLOCKED tile or the grid edge. Blocked tiles are
   not covered. Constraint tiles are NOT blocked — beams pass through them.
   Coverage of a tile = number of towers whose beam reaches it.
───────────────────────────────────────────────────────────────────────────── */

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: "Introduction",
    hint: "Each number is the exact signal count that cell must receive.",
    // Solution: towers at (1,2) and (4,4)
    // (0,2)→col2 T1=1  (1,4)→row1+col4=2  (1,5)→row1=1
    // (4,0)→row4=1  (4,2)→col2+row4=2  (5,4)→col4=1
    grid: [
      [E(), E(), N(1), E(), E(), E()],
      [E(), E(), E(), E(), N(2), N(1)],
      [E(), E(), E(), E(), E(), E()],
      [E(), E(), E(), E(), E(), E()],
      [N(1), E(), N(2), E(), E(), E()],
      [E(), E(), E(), E(), N(1), E()],
    ],
  },
  {
    id: 2,
    title: "Crossroads",
    hint: "Three towers must form a triangle of intersecting signals.",
    // Solution: towers at (0,3), (3,0), (5,5)
    // (0,0)→row0+col0=2  (0,5)→row0+col5=2  (1,3)→col3=1
    // (3,4)→row3=1  (3,5)→row3+col5=2  (5,1)→row5=1  (5,3)→col3+row5=2
    grid: [
      [N(2), E(), E(), E(), E(), N(2)],
      [E(), E(), E(), N(1), E(), E()],
      [E(), E(), E(), E(), E(), E()],
      [E(), E(), E(), E(), N(1), N(2)],
      [E(), E(), E(), E(), E(), E()],
      [E(), N(1), E(), N(2), E(), E()],
    ],
  },
  {
    id: 3,
    title: "Barrier",
    hint: "A blocked tile cuts the signal — plan your towers around it.",
    // Blocker at (3,2).  Solution: towers at (0,2), (4,4), (5,0)
    // T1=(0,2): col2 down stops at blocker → covers (1,2),(2,2) only
    // (0,0)→row0+col0=2  (0,4)→row0+col4=2  (1,2)→col2 T1=1
    // (4,0)→row4+col0=2  (4,2)→row4 T2=1 (col2 blocked)
    // (5,2)→row5 T3=1 (col2 blocked)  (5,4)→row5+col4=2
    grid: [
      [N(2), E(), E(), E(), N(2), E()],
      [E(), E(), N(1), E(), E(), E()],
      [E(), E(), E(), E(), E(), E()],
      [E(), E(), B(), E(), E(), E()],
      [N(2), E(), N(1), E(), E(), E()],
      [E(), E(), N(1), E(), N(2), E()],
    ],
  },
  {
    id: 4,
    title: "Compression",
    hint: "Two barriers fragment the grid — find the right gaps.",
    // Blockers at (0,3) and (5,2).  Solution: towers at (0,5), (3,2), (4,0)
    // T2=(0,5): row0 left blocked at (0,3) → only covers (0,4)
    // T1=(3,2): col2 down blocked at (5,2) → covers (4,2) only below tower
    // (0,0)→col0 T3=1  (0,2)→col2 T1=1 [T2 row0 blocked]
    // (3,0)→row3 T1 + col0 T3=2  (4,2)→col2 T1 + row4 T3=2
    // (4,5)→row4 T3 + col5 T2=2  (5,5)→col5 T2=1
    grid: [
      [N(1), E(), N(1), B(), E(), E()],
      [E(), E(), E(), E(), E(), E()],
      [E(), E(), E(), E(), E(), E()],
      [N(2), E(), E(), E(), E(), E()],
      [E(), E(), N(2), E(), E(), N(2)],
      [E(), E(), B(), E(), E(), N(1)],
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Core logic
───────────────────────────────────────────────────────────────────────────── */

function makeTowers(): boolean[][] {
  return Array.from({ length: GS }, () => new Array<boolean>(GS).fill(false));
}

function computeCoverage(grid: PCell[][], towers: boolean[][]): number[][] {
  const cov = Array.from({ length: GS }, () => new Array<number>(GS).fill(0));
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      if (!towers[r][c]) continue;
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as [number, number][]) {
        let nr = r + dr,
          nc = c + dc;
        while (nr >= 0 && nr < GS && nc >= 0 && nc < GS) {
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

/* ─────────────────────────────────────────────────────────────────────────────
   Signal Game — main component
───────────────────────────────────────────────────────────────────────────── */

function SignalGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [towers, setTowers] = useState<boolean[][]>(makeTowers);
  const [history, setHistory] = useState<boolean[][][]>([]);
  const [won, setWon] = useState(false);
  const [pulseKey, setPulseKey] = useState("");

  const puzzle = PUZZLES[puzzleIdx];
  const coverage = computeCoverage(puzzle.grid, towers);
  const solved = checkWin(puzzle.grid, coverage);

  // Delay win overlay slightly so the last satisfaction animation can play
  useEffect(() => {
    if (solved && !won) {
      const t = setTimeout(() => setWon(true), 420);
      return () => clearTimeout(t);
    }
  }, [solved, won]);

  const handleClick = (r: number, c: number) => {
    if (won || puzzle.grid[r][c].kind !== "empty") return;
    const placing = !towers[r][c];
    setHistory((h) => [...h, towers.map((row) => [...row])]);
    setTowers((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
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
  };
  const doUndo = () => {
    if (!history.length) return;
    setTowers(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };
  const doNext = () => {
    setPuzzleIdx((i) => (i + 1) % PUZZLES.length);
    setHistory([]);
    setTowers(makeTowers());
    setWon(false);
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
    { label: "Next →", fn: doNext, disabled: false },
  ];

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
        {/* ── Puzzle header ────────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Puzzle {puzzle.id} of {PUZZLES.length}
          </p>
          <p className="font-display text-2xl font-extrabold leading-tight text-foreground">
            {puzzle.title}
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {puzzle.hint}
          </p>
        </div>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">
            {satisfiedCount}/{totalConstraints} satisfied
          </span>
          <div className="flex gap-1.5">
            {PUZZLES.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-2 w-2 rounded-full border border-foreground/30 transition-all",
                  i < puzzleIdx
                    ? "bg-foreground/25"
                    : i === puzzleIdx
                      ? "bg-card-sky border-foreground shadow-[0_0_0_1px_var(--foreground)]"
                      : "bg-muted",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        {/* ── Game board ───────────────────────────────────────────────────── */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GS}, 1fr)`,
              gap: 5,
              maxWidth: 352,
              margin: "0 auto",
            }}
          >
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

        {/* ── Win overlay ──────────────────────────────────────────────────── */}
        <WinOverlay
          show={won}
          onPlayAgain={doNext}
          message="Signal Complete!"
          sub={
            puzzleIdx < PUZZLES.length - 1
              ? "Next puzzle incoming…"
              : "All puzzles cleared — loop continues!"
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
  onClick: () => void;
}

function GridCell({ cell, hasTower, cov, pulsing, onClick }: GridCellProps) {
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
};

export default SignalMeta;
