import { ChevronsRight } from "lucide-react";
import type { Game } from "./types";
import { useCallback, useEffect, useState } from "react";
import { WinOverlay } from "./_WinOverlay";
import { DevComplete } from "./_DevComplete";

// ─── Futoshiki Engine (5x5 latin square + inequality constraints) ────────────

const N = 5;
type Grid = (number | null)[][];

// Inequality between two adjacent cells. "gt" means a > b, "lt" means a < b.
type Constraint = { r1: number; c1: number; r2: number; c2: number; type: "gt" | "lt" };

function emptyGrid(): Grid {
  return Array.from({ length: N }, () => Array(N).fill(null));
}

function deepCopy(g: Grid): Grid {
  return g.map((r) => [...r]);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate a random latin square via permuted rows of [1..N]
function generateLatinSquare(): Grid {
  while (true) {
    const grid: Grid = emptyGrid();
    if (fillLatin(grid, 0, 0)) return grid;
  }
}

function fillLatin(grid: Grid, r: number, c: number): boolean {
  if (r === N) return true;
  const [nr, nc] = c === N - 1 ? [r + 1, 0] : [r, c + 1];
  for (const n of shuffle([1, 2, 3, 4, 5])) {
    let ok = true;
    for (let i = 0; i < N; i++) {
      if (grid[r][i] === n || grid[i][c] === n) {
        ok = false;
        break;
      }
    }
    if (ok) {
      grid[r][c] = n;
      if (fillLatin(grid, nr, nc)) return true;
      grid[r][c] = null;
    }
  }
  return false;
}

function generatePuzzle() {
  const solution = generateLatinSquare();

  // Pick ~6 random adjacent inequalities
  const candidates: Constraint[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c < N - 1) {
        const a = solution[r][c]!;
        const b = solution[r][c + 1]!;
        candidates.push({ r1: r, c1: c, r2: r, c2: c + 1, type: a > b ? "gt" : "lt" });
      }
      if (r < N - 1) {
        const a = solution[r][c]!;
        const b = solution[r + 1][c]!;
        candidates.push({ r1: r, c1: c, r2: r + 1, c2: c, type: a > b ? "gt" : "lt" });
      }
    }
  }
  const constraints = shuffle(candidates).slice(0, 7);

  // Reveal a few givens to make it tractable
  const puzzle = emptyGrid();
  const positions = shuffle(Array.from({ length: N * N }, (_, i) => i)).slice(0, 4);
  for (const p of positions) {
    const r = Math.floor(p / N);
    const c = p % N;
    puzzle[r][c] = solution[r][c];
  }

  return { puzzle, solution, constraints };
}

// ─── Component ────────────────────────────────────────────────────────────────

function FutoshikiGame() {
  const [puzzle, setPuzzle] = useState<Grid>(emptyGrid);
  const [solution, setSolution] = useState<Grid>(emptyGrid);
  const [userGrid, setUserGrid] = useState<Grid>(emptyGrid);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    const { puzzle, solution, constraints } = generatePuzzle();
    setPuzzle(deepCopy(puzzle));
    setSolution(deepCopy(solution));
    setUserGrid(deepCopy(puzzle));
    setConstraints(constraints);
    setSelected(null);
    setWon(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Conflicts: row/col duplicates + violated inequalities
  const errors = useState<Set<string>>(new Set())[0]; // unused, kept for symmetry
  const getErrors = useCallback(
    (g: Grid): Set<string> => {
      const errs = new Set<string>();
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const v = g[r][c];
          if (v === null) continue;
          for (let i = 0; i < N; i++) {
            if (i !== c && g[r][i] === v) {
              errs.add(`${r},${c}`);
              errs.add(`${r},${i}`);
            }
            if (i !== r && g[i][c] === v) {
              errs.add(`${r},${c}`);
              errs.add(`${i},${c}`);
            }
          }
        }
      }
      for (const k of constraints) {
        const a = g[k.r1][k.c1];
        const b = g[k.r2][k.c2];
        if (a === null || b === null) continue;
        if (k.type === "gt" && !(a > b)) {
          errs.add(`${k.r1},${k.c1}`);
          errs.add(`${k.r2},${k.c2}`);
        }
        if (k.type === "lt" && !(a < b)) {
          errs.add(`${k.r1},${k.c1}`);
          errs.add(`${k.r2},${k.c2}`);
        }
      }
      return errs;
    },
    [constraints],
  );

  const cellErrors = getErrors(userGrid);
  void errors;

  const inputNumber = useCallback(
    (num: number | null) => {
      if (!selected || won) return;
      const [r, c] = selected;
      if (puzzle[r][c] !== null) return;
      const next = deepCopy(userGrid);
      next[r][c] = num;
      setUserGrid(next);
    },
    [selected, won, puzzle, userGrid],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= "1" && e.key <= String(N)) {
        e.preventDefault();
        inputNumber(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        inputNumber(null);
      } else if (e.key === "ArrowUp" && r > 0) setSelected([r - 1, c]);
      else if (e.key === "ArrowDown" && r < N - 1) setSelected([r + 1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelected([r, c - 1]);
      else if (e.key === "ArrowRight" && c < N - 1) setSelected([r, c + 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber]);

  // Win check
  useEffect(() => {
    if (won) return;
    if (solution[0][0] === null) return;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (userGrid[r][c] !== solution[r][c]) return;
      }
    }
    setWon(true);
  }, [userGrid, solution, won]);

  // Build a sparse 9x9-ish render: cells with constraint glyphs between them.
  // We render a (2N-1)x(2N-1) grid: even indices are cells, odd are gaps.
  const cellSize = "2.75rem";
  const gapSize = "1rem";
  const dim = N * 2 - 1;

  const findConstraint = (r1: number, c1: number, r2: number, c2: number) =>
    constraints.find(
      (k) =>
        (k.r1 === r1 && k.c1 === c1 && k.r2 === r2 && k.c2 === c2) ||
        (k.r1 === r2 && k.c1 === c2 && k.r2 === r1 && k.c2 === c1 && false), // direction matters
    );

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay
        show={won}
        onPlayAgain={startGame}
        message="Futoshiki Solved!"
        sub="A perfectly balanced board. Well done!"
      />

      <div
        className="p-4 rounded-2xl bg-violet-50 border-2 border-violet-200 shadow-lg"
        style={{
          display: "grid",
          gridTemplateColumns: Array.from(
            { length: dim },
            (_, i) => (i % 2 === 0 ? cellSize : gapSize),
          ).join(" "),
          gridTemplateRows: Array.from(
            { length: dim },
            (_, i) => (i % 2 === 0 ? cellSize : gapSize),
          ).join(" "),
        }}
      >
        {Array.from({ length: dim }, (_, gr) =>
          Array.from({ length: dim }, (_, gc) => {
            const isCell = gr % 2 === 0 && gc % 2 === 0;
            const isHGap = gr % 2 === 0 && gc % 2 === 1; // horizontal between left/right cells
            const isVGap = gr % 2 === 1 && gc % 2 === 0; // vertical between top/bottom cells

            if (isCell) {
              const r = gr / 2;
              const c = gc / 2;
              const val = userGrid[r][c];
              const isGiven = puzzle[r][c] !== null;
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const isErr = cellErrors.has(`${r},${c}`);
              const bg = isSel
                ? "bg-violet-300"
                : isErr
                  ? "bg-red-100"
                  : isGiven
                    ? "bg-violet-100"
                    : "bg-white";
              const text = isErr
                ? "text-red-500"
                : isGiven
                  ? "text-violet-900 font-bold"
                  : "text-violet-600 font-semibold";
              return (
                <div
                  key={`${gr}-${gc}`}
                  onClick={() => !won && setSelected([r, c])}
                  className={`flex items-center justify-center rounded-lg cursor-pointer text-lg border border-violet-200 transition-colors ${bg} ${text}`}
                >
                  {val ?? ""}
                </div>
              );
            }

            if (isHGap) {
              const r = gr / 2;
              const cL = (gc - 1) / 2;
              const cR = (gc + 1) / 2;
              const k = findConstraint(r, cL, r, cR);
              return (
                <div
                  key={`${gr}-${gc}`}
                  className="flex items-center justify-center text-violet-500 font-black text-lg"
                >
                  {k ? (k.type === "gt" ? ">" : "<") : ""}
                </div>
              );
            }

            if (isVGap) {
              const c = gc / 2;
              const rT = (gr - 1) / 2;
              const rB = (gr + 1) / 2;
              const k = findConstraint(rT, c, rB, c);
              return (
                <div
                  key={`${gr}-${gc}`}
                  className="flex items-center justify-center text-violet-500 font-black text-lg leading-none"
                >
                  {k ? (k.type === "gt" ? "∨" : "∧") : ""}
                </div>
              );
            }

            return <div key={`${gr}-${gc}`} />;
          }),
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => inputNumber(n)}
            className="w-10 h-10 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => inputNumber(null)}
          className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startGame}
          className="px-6 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-sm transition-colors shadow-md shadow-violet-200"
        >
          New Game
        </button>
        {/* DEV: comment out the next line to remove the dev complete button */}
        <DevComplete onComplete={() => setUserGrid(deepCopy(solution))} />
      </div>

      <p className="text-xs text-slate-400 text-center max-w-md">
        Fill the grid 1–5 so each row and column has each number once. Arrows
        (&gt; &lt; ∧ ∨) show that one cell must be greater than its neighbor.
      </p>
    </div>
  );
}

const Futoshiki: Game = {
  slug: "futoshiki",
  title: "Futoshiki",
  description: "Greater than, less than. A quiet duel of inequalities.",
  icon: ChevronsRight,
  color: "lilac",
  category: "classics",
  Component: FutoshikiGame,
};

export default Futoshiki;
