import { Grid3x3 } from "lucide-react";
import type { Game } from "./types";
import { useState, useCallback, useEffect } from "react";
import { WinOverlay } from "./_WinOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

const ROWS = 5;
const COLS = 5;

type CellValue = number | null;
type Board = CellValue[][];
// regionMap[r][c] = region index
type RegionMap = number[][];

// ─── Region Generation ────────────────────────────────────────────────────────

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateRegions(): RegionMap {
  const map: RegionMap = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  let regionId = 0;

  // Grow regions using flood fill from random seeds until all cells are covered
  const cells = shuffle(Array.from({ length: ROWS * COLS }, (_, i) => i));
  const seeds: number[] = [];

  // Pick ~6 seeds for a 5x5 grid
  const numRegions = 6;
  for (let i = 0; i < numRegions; i++) seeds.push(cells[i]);

  for (const seed of seeds) {
    const r = Math.floor(seed / COLS);
    const c = seed % COLS;
    if (map[r][c] === -1) map[r][c] = regionId++;
  }

  // Grow each region greedily
  let changed = true;
  while (changed) {
    changed = false;
    const order = shuffle(Array.from({ length: ROWS * COLS }, (_, i) => i));
    for (const idx of order) {
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;
      if (map[r][c] !== -1) continue;

      // Find adjacent assigned region with smallest size
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      const adjRegions: number[] = [];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && map[nr][nc] !== -1)
          adjRegions.push(map[nr][nc]);
      }
      if (adjRegions.length > 0) {
        // Pick region that appears most often in adjacency (grow largest neighbor for compactness)
        const count: Record<number, number> = {};
        for (const rid of adjRegions) count[rid] = (count[rid] ?? 0) + 1;
        const best = parseInt(Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]);
        map[r][c] = best;
        changed = true;
      }
    }
  }

  // Assign any remaining orphans to nearest region
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r][c] === -1) map[r][c] = 0;

  return map;
}

function regionSizes(rmap: RegionMap): Map<number, number> {
  const sizes = new Map<number, number>();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const id = rmap[r][c];
      sizes.set(id, (sizes.get(id) ?? 0) + 1);
    }
  return sizes;
}

// ─── Puzzle Solver / Generator ────────────────────────────────────────────────

function neighbors8(r: number, c: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) result.push([nr, nc]);
    }
  return result;
}

function canPlaceCell(board: Board, rmap: RegionMap, sizes: Map<number, number>, r: number, c: number, val: number): boolean {
  const regionId = rmap[r][c];
  const maxVal = sizes.get(regionId) ?? 1;
  if (val < 1 || val > maxVal) return false;

  // No duplicate in region
  for (let rr = 0; rr < ROWS; rr++)
    for (let cc = 0; cc < COLS; cc++)
      if ((rr !== r || cc !== c) && rmap[rr][cc] === regionId && board[rr][cc] === val)
        return false;

  // No same value in 8-neighbors
  for (const [nr, nc] of neighbors8(r, c))
    if (board[nr][nc] === val) return false;

  return true;
}

function solveBoard(board: Board, rmap: RegionMap, sizes: Map<number, number>): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === null) {
        const regionId = rmap[r][c];
        const maxVal = sizes.get(regionId) ?? 1;
        for (const v of shuffle(Array.from({ length: maxVal }, (_, i) => i + 1))) {
          if (canPlaceCell(board, rmap, sizes, r, c, v)) {
            board[r][c] = v;
            if (solveBoard(board, rmap, sizes)) return true;
            board[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(): { puzzle: Board; solution: Board; rmap: RegionMap } {
  let rmap: RegionMap;
  let solution: Board;
  const sizes = new Map<number, number>();

  // Retry until we get a solvable configuration
  while (true) {
    rmap = generateRegions();
    const s = regionSizes(rmap);
    sizes.clear();
    s.forEach((v, k) => sizes.set(k, v));

    // Reject regions larger than 5 (Tectonic convention)
    let valid = true;
    for (const sz of sizes.values()) if (sz > 5) { valid = false; break; }
    if (!valid) continue;

    solution = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    if (solveBoard(solution, rmap, sizes)) break;
  }

  // Remove ~55% of cells for the puzzle
  const puzzle: Board = solution!.map((row) => [...row]);
  const positions = shuffle(Array.from({ length: ROWS * COLS }, (_, i) => i));
  const toRemove = Math.floor(ROWS * COLS * 0.55);
  for (let i = 0; i < toRemove; i++) {
    const pos = positions[i];
    puzzle[Math.floor(pos / COLS)][pos % COLS] = null;
  }

  return { puzzle, solution: solution!, rmap: rmap! };
}

// ─── Region Border Helpers ────────────────────────────────────────────────────

function hasBorder(rmap: RegionMap, r: number, c: number, dir: "right" | "bottom"): boolean {
  if (dir === "right") {
    if (c >= COLS - 1) return false;
    return rmap[r][c] !== rmap[r][c + 1];
  } else {
    if (r >= ROWS - 1) return false;
    return rmap[r][c] !== rmap[r + 1][c];
  }
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const REGION_COLORS = [
  "bg-emerald-50", "bg-teal-50", "bg-cyan-50",
  "bg-green-50",   "bg-sky-50",  "bg-lime-50",
  "bg-emerald-100","bg-teal-100","bg-cyan-100",
];

// ─── Component ────────────────────────────────────────────────────────────────

function TectonicGame() {
  const [puzzle, setPuzzle] = useState<Board>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [solution, setSolution] = useState<Board>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [userBoard, setUserBoard] = useState<Board>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [rmap, setRmap] = useState<RegionMap>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [sizes, setSizes] = useState<Map<number, number>>(new Map());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    const { puzzle, solution, rmap } = generatePuzzle();
    const sz = regionSizes(rmap);
    setPuzzle(puzzle.map((r) => [...r]));
    setSolution(solution.map((r) => [...r]));
    setUserBoard(puzzle.map((r) => [...r]));
    setRmap(rmap.map((r) => [...r]));
    setSizes(sz);
    setSelected(null);
    setErrors(new Set());
    setWon(false);
  }, []);

  useEffect(() => { startGame(); }, [startGame]);

  const checkErrors = useCallback((board: Board, rm: RegionMap, sz: Map<number, number>): Set<string> => {
    const errs = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = board[r][c];
        if (v === null) continue;
        // Check region duplicate
        for (let rr = 0; rr < ROWS; rr++)
          for (let cc = 0; cc < COLS; cc++)
            if ((rr !== r || cc !== c) && rm[rr][cc] === rm[r][c] && board[rr][cc] === v) {
              errs.add(`${r},${c}`); errs.add(`${rr},${cc}`);
            }
        // Check 8-neighbors
        for (const [nr, nc] of neighbors8(r, c))
          if (board[nr][nc] === v) { errs.add(`${r},${c}`); errs.add(`${nr},${nc}`); }
        // Check value in range
        const maxVal = sz.get(rm[r][c]) ?? 1;
        if (v > maxVal) errs.add(`${r},${c}`);
      }
    }
    return errs;
  }, []);

  const isComplete = useCallback((board: Board, sol: Board): boolean => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] !== sol[r][c]) return false;
    return true;
  }, []);

  const inputNumber = useCallback((val: number | null) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== null) return;

    const newBoard = userBoard.map((row) => [...row]);
    newBoard[r][c] = val;
    setUserBoard(newBoard);

    const errs = checkErrors(newBoard, rmap, sizes);
    setErrors(errs);

    if (errs.size === 0 && isComplete(newBoard, solution)) setWon(true);
  }, [selected, won, puzzle, userBoard, rmap, sizes, solution, checkErrors, isComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= "1" && e.key <= "5") { e.preventDefault(); inputNumber(parseInt(e.key)); }
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") inputNumber(null);
      else if (e.key === "ArrowUp"    && r > 0) { e.preventDefault(); setSelected([r - 1, c]); }
      else if (e.key === "ArrowDown"  && r < ROWS - 1) { e.preventDefault(); setSelected([r + 1, c]); }
      else if (e.key === "ArrowLeft"  && c > 0) { e.preventDefault(); setSelected([r, c - 1]); }
      else if (e.key === "ArrowRight" && c < COLS - 1) { e.preventDefault(); setSelected([r, c + 1]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber]);

  const CELL = 56; // px

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay show={won} onPlayAgain={startGame} message="Tectonic Solved!" sub="Every region perfectly filled!" />

      {/* Instructions */}
      <p className="text-xs text-slate-400 max-w-xs text-center">
        Fill each region with <strong>1 → region size</strong>. No two identical numbers may touch — even diagonally.
      </p>

      {/* Grid */}
      <div className="relative shadow-xl rounded-xl overflow-hidden border-2 border-slate-600"
        style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gridTemplateRows: `repeat(${ROWS}, ${CELL}px)` }}>
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const val     = userBoard[r][c];
            const isGiven = puzzle[r][c] !== null;
            const isErr   = errors.has(`${r},${c}`);
            const isSel   = selected?.[0] === r && selected?.[1] === c;
            const regionId = rmap[r][c];
            const regionColor = REGION_COLORS[regionId % REGION_COLORS.length];

            const borderR = hasBorder(rmap, r, c, "right")  ? "3px solid #475569" : "1px solid #cbd5e1";
            const borderB = hasBorder(rmap, r, c, "bottom") ? "3px solid #475569" : "1px solid #cbd5e1";
            const borderT = r === 0 ? "none" : "1px solid #cbd5e1";
            const borderL = c === 0 ? "none" : "1px solid #cbd5e1";

            let bg = regionColor;
            if (isSel)     bg = "bg-emerald-300";
            else if (isErr) bg = "bg-red-100";

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => !won && setSelected([r, c])}
                className={`flex items-center justify-center cursor-pointer transition-colors ${bg}`}
                style={{ width: CELL, height: CELL, borderTop: borderT, borderLeft: borderL, borderRight: borderR, borderBottom: borderB }}
              >
                <span className={`text-xl font-bold ${isErr ? "text-red-500" : isGiven ? "text-slate-800" : "text-emerald-600"}`}>
                  {val ?? ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Number pad — show 1–5 */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => inputNumber(n)}
            className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-base transition-colors">
            {n}
          </button>
        ))}
        <button onClick={() => inputNumber(null)}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 text-base font-bold transition-colors">
          ✕
        </button>
      </div>

      <button onClick={startGame}
        className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-200">
        New Game
      </button>

      <p className="text-xs text-slate-400">Click a cell · type 1–5 · arrow keys to navigate</p>
    </div>
  );
}

// ─── Game Registration ────────────────────────────────────────────────────────

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
