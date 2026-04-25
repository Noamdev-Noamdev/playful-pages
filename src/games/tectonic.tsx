import { Grid3x3 } from "lucide-react";
import type { Game } from "./types";
import { useCallback, useEffect, useState } from "react";
import { WinOverlay } from "./_WinOverlay";
import { DevComplete } from "./_DevComplete";

// ─── Tectonic (Suguru) ────────────────────────────────────────────────────────
// 5x5 grid divided into regions. Each region of size N contains 1..N.
// No two orthogonally OR diagonally adjacent cells may share a value.

const ROWS = 5;
const COLS = 5;
type Cell = number | null;
type Grid = Cell[][];

// Hand-crafted 5x5 puzzles. Each puzzle: regions (id per cell), full solution,
// and which cells are revealed as givens.
interface Puzzle {
  regions: number[][];
  solution: number[][];
  givens: boolean[][];
}

const PUZZLES: Puzzle[] = [
  {
    regions: [[0,0,0,1,1],[2,2,3,1,1],[2,2,3,3,1],[4,4,3,3,5],[4,4,4,5,5]],
    solution: [[1,2,3,5,2],[3,4,1,4,1],[1,2,3,2,3],[3,5,4,5,1],[4,1,2,3,2]],
    givens: [[true,true,false,false,true],[false,true,false,false,true],[true,true,false,false,false],[false,true,true,false,false],[true,true,false,true,false]],
  },
  {
    regions: [[0,1,1,2,2],[0,0,1,1,2],[0,3,4,4,5],[3,3,4,4,5],[3,3,4,5,5]],
    solution: [[1,2,1,2,1],[3,4,3,4,3],[2,1,2,1,2],[4,5,4,5,4],[3,2,3,1,3]],
    givens: [[true,false,false,false,true],[true,false,false,true,false],[true,false,true,true,true],[false,true,false,true,false],[false,false,true,false,true]],
  },
  {
    regions: [[0,0,1,1,1],[0,0,2,2,3],[0,4,2,2,3],[4,4,5,3,3],[5,5,5,5,3]],
    solution: [[1,2,3,2,1],[3,4,1,4,3],[5,2,3,2,1],[3,1,4,5,4],[2,5,3,1,2]],
    givens: [[true,true,true,false,false],[true,true,false,true,false],[true,false,false,true,true],[false,false,true,false,false],[false,true,false,false,true]],
  },
  {
    regions: [[0,0,0,1,1],[2,2,0,0,1],[2,2,2,3,1],[4,4,4,3,1],[4,4,3,3,3]],
    solution: [[5,4,2,4,2],[2,3,1,3,5],[1,5,4,2,1],[4,2,1,5,3],[3,5,3,4,1]],
    givens: [[true,true,true,false,false],[false,true,false,true,false],[false,false,true,true,false],[true,true,false,false,false],[true,false,true,true,false]],
  },
  {
    regions: [[0,0,1,1,1],[0,0,0,1,1],[2,2,3,3,4],[2,5,5,3,4],[5,5,5,3,4]],
    solution: [[1,3,2,3,1],[2,5,4,5,4],[1,3,2,1,3],[2,4,5,4,2],[1,3,2,3,1]],
    givens: [[true,true,true,false,true],[false,false,false,true,true],[true,false,false,true,true],[false,true,false,false,false],[false,true,false,false,true]],
  },
];

const REGION_COLORS = [
  "bg-emerald-50",
  "bg-amber-50",
  "bg-sky-50",
  "bg-rose-50",
  "bg-violet-50",
  "bg-lime-50",
];

function deepCopy(g: Grid): Grid {
  return g.map((r) => [...r]);
}

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function neighbors(r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push([nr, nc]);
    }
  }
  return out;
}

// Compute which cells violate adjacency or region constraints.
function getErrors(g: Grid, regions: number[][]): Set<string> {
  const errs = new Set<string>();
  // Adjacency
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = g[r][c];
      if (v === null) continue;
      for (const [nr, nc] of neighbors(r, c)) {
        if (g[nr][nc] === v) {
          errs.add(`${r},${c}`);
          errs.add(`${nr},${nc}`);
        }
      }
    }
  }
  // Region duplicate
  const byRegion: Record<number, [number, number, number][]> = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = g[r][c];
      if (v === null) continue;
      const id = regions[r][c];
      (byRegion[id] = byRegion[id] || []).push([r, c, v]);
    }
  }
  for (const list of Object.values(byRegion)) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i][2] === list[j][2]) {
          errs.add(`${list[i][0]},${list[i][1]}`);
          errs.add(`${list[j][0]},${list[j][1]}`);
        }
      }
    }
  }
  return errs;
}

// Region size for max digit
function regionSizes(regions: number[][]): Record<number, number> {
  const sizes: Record<number, number> = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = regions[r][c];
      sizes[id] = (sizes[id] || 0) + 1;
    }
  }
  return sizes;
}

function TectonicGame() {
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [userGrid, setUserGrid] = useState<Grid>(emptyGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    const p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    setPuzzle(p);
    const g: Grid = emptyGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (p.givens[r][c]) g[r][c] = p.solution[r][c];
      }
    }
    setUserGrid(g);
    setSelected(null);
    setWon(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const sizes = regionSizes(puzzle.regions);
  const errors = getErrors(userGrid, puzzle.regions);

  const inputNumber = useCallback(
    (num: number | null) => {
      if (!selected || won) return;
      const [r, c] = selected;
      if (puzzle.givens[r][c]) return;
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
      if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        inputNumber(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        inputNumber(null);
      } else if (e.key === "ArrowUp" && r > 0) setSelected([r - 1, c]);
      else if (e.key === "ArrowDown" && r < ROWS - 1) setSelected([r + 1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelected([r, c - 1]);
      else if (e.key === "ArrowRight" && c < COLS - 1) setSelected([r, c + 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber]);

  // Win check — match solution
  useEffect(() => {
    if (won) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (userGrid[r][c] !== puzzle.solution[r][c]) return;
      }
    }
    setWon(true);
  }, [userGrid, puzzle, won]);

  // Determine borders per cell — thick where region differs from neighbor
  const borderClass = (r: number, c: number) => {
    const id = puzzle.regions[r][c];
    const top = r > 0 && puzzle.regions[r - 1][c] !== id;
    const bottom = r < ROWS - 1 && puzzle.regions[r + 1][c] !== id;
    const left = c > 0 && puzzle.regions[r][c - 1] !== id;
    const right = c < COLS - 1 && puzzle.regions[r][c + 1] !== id;
    return [
      "border-emerald-700",
      r === 0 ? "border-t-2" : top ? "border-t-2" : "border-t",
      r === ROWS - 1 ? "border-b-2" : bottom ? "border-b-2" : "border-b",
      c === 0 ? "border-l-2" : left ? "border-l-2" : "border-l",
      c === COLS - 1 ? "border-r-2" : right ? "border-r-2" : "border-r",
    ].join(" ");
  };

  const maxDigit = selected ? sizes[puzzle.regions[selected[0]][selected[1]]] : 5;

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay
        show={won}
        onPlayAgain={startGame}
        message="Tectonic Solved!"
        sub="Every region falls into place. Brilliant work!"
      />

      <div
        className="rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-700"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 3rem)",
          gridTemplateRows: "repeat(5, 3rem)",
        }}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const v = userGrid[r][c];
            const isGiven = puzzle.givens[r][c];
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isErr = errors.has(`${r},${c}`);
            const regionBg = REGION_COLORS[puzzle.regions[r][c] % REGION_COLORS.length];
            const bg = isSel ? "bg-emerald-300" : isErr ? "bg-red-100" : regionBg;
            const text = isErr
              ? "text-red-500"
              : isGiven
                ? "text-emerald-900 font-bold"
                : "text-emerald-700 font-semibold";
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => !won && setSelected([r, c])}
                className={`flex items-center justify-center cursor-pointer text-lg transition-colors ${bg} ${text} ${borderClass(r, c)}`}
              >
                {v ?? ""}
              </div>
            );
          }),
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => inputNumber(n)}
            disabled={n > maxDigit}
            className="w-10 h-10 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
          className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-200"
        >
          New Game
        </button>
        {/* DEV: comment out the next line to remove the dev complete button */}
        <DevComplete onComplete={() => setUserGrid(deepCopy(puzzle.solution) as Grid)} />
      </div>

      <p className="text-xs text-slate-400 text-center max-w-md">
        Fill each region with 1..N (region size). No two touching cells (incl.
        diagonals) may share a number.
      </p>
    </div>
  );
}

const Tectonic: Game = {
  slug: "tectonic",
  title: "Tectonic",
  description: "Fill the regions so no neighbors match. Logic in tiny tiles.",
  icon: Grid3x3,
  color: "mint",
  category: "classics",
  Component: TectonicGame,
};

export default Tectonic;
