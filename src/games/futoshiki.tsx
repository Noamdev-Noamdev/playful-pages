import { ChevronsRight } from "lucide-react";
import type { Game } from "./types";
import { useState, useCallback, useEffect } from "react";
import { WinOverlay } from "./_WinOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

const N = 5;
type FGrid = (number | null)[][];
// Ineq means: grid[r1][c1] < grid[r2][c2]
type FIneq = { r1: number; c1: number; r2: number; c2: number };

// ─── Engine ───────────────────────────────────────────────────────────────────

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deepCopyGrid(g: FGrid): FGrid { return g.map((r) => [...r]); }

function canPlace(grid: FGrid, ineqs: FIneq[], r: number, c: number, v: number): boolean {
  // Row / col uniqueness
  for (let i = 0; i < N; i++) {
    if (i !== c && grid[r][i] === v) return false;
    if (i !== r && grid[i][c] === v) return false;
  }
  // Inequality constraints involving this cell
  for (const { r1, c1, r2, c2 } of ineqs) {
    if (r1 === r && c1 === c) {
      // v < grid[r2][c2]
      const other = grid[r2][c2];
      if (other !== null && v >= other) return false;
      if (other === null && v === N) return false; // no room left above v
    }
    if (r2 === r && c2 === c) {
      // grid[r1][c1] < v
      const other = grid[r1][c1];
      if (other !== null && other >= v) return false;
      if (other === null && v === 1) return false; // no room left below v
    }
  }
  return true;
}

// Count solutions up to `limit` — stops early
function countSolutions(grid: FGrid, ineqs: FIneq[], limit = 2): number {
  let count = 0;
  function bt(): void {
    if (count >= limit) return;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === null) {
          for (let v = 1; v <= N; v++) {
            if (canPlace(grid, ineqs, r, c, v)) {
              grid[r][c] = v;
              bt();
              grid[r][c] = null;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  bt();
  return count;
}

function generateFullGrid(ineqs: FIneq[]): FGrid | null {
  const grid: FGrid = Array.from({ length: N }, () => Array(N).fill(null));
  function bt(): boolean {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === null) {
          for (const v of shuffle([1, 2, 3, 4, 5])) {
            if (canPlace(grid, ineqs, r, c, v)) {
              grid[r][c] = v;
              if (bt()) return true;
              grid[r][c] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  return bt() ? grid : null;
}

function generatePuzzle(): { puzzle: FGrid; solution: FGrid; ineqs: FIneq[] } {
  while (true) {
    // 1. Pick ~7 random inequalities between adjacent cells
    const allPairs: [number, number, number, number][] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (c + 1 < N) allPairs.push([r, c, r, c + 1]);
        if (r + 1 < N) allPairs.push([r, c, r + 1, c]);
      }
    const chosen = shuffle(allPairs).slice(0, 7);

    // 2. Generate a full Latin square satisfying no constraints yet
    const solution = generateFullGrid([]);
    if (!solution) continue;

    // 3. Orient each chosen pair according to the solution
    const ineqs: FIneq[] = chosen.map(([r1, c1, r2, c2]) => {
      return solution[r1][c1] < solution[r2][c2]
        ? { r1, c1, r2, c2 }
        : { r1: r2, c1: c2, r2: r1, c2: c1 };
    });

    // 4. Verify the solution still satisfies all constraints
    let valid = true;
    for (const { r1, c1, r2, c2 } of ineqs)
      if (solution[r1][c1] >= solution[r2][c2]) { valid = false; break; }
    if (!valid) continue;

    // 5. Remove cells while maintaining uniqueness
    const puzzle = deepCopyGrid(solution);
    const positions = shuffle(Array.from({ length: N * N }, (_, i) => i));

    for (const pos of positions) {
      const r = Math.floor(pos / N);
      const c = pos % N;
      const saved = puzzle[r][c];
      puzzle[r][c] = null;
      if (countSolutions(deepCopyGrid(puzzle), ineqs, 2) !== 1) {
        puzzle[r][c] = saved; // restore — uniqueness would break
      }
    }

    // Require at least 7 empty cells (otherwise puzzle is too easy)
    const filled = puzzle.flat().filter((v) => v !== null).length;
    if (filled > N * N - 7) continue;

    return { puzzle, solution, ineqs };
  }
}

// ─── Helpers for reading constraints ─────────────────────────────────────────

function getHorizSign(ineqs: FIneq[], r: number, c: number): "<" | ">" | null {
  // Between (r,c) and (r,c+1)
  for (const { r1, c1, r2, c2 } of ineqs) {
    if (r1 === r && c1 === c && r2 === r && c2 === c + 1) return "<";
    if (r1 === r && c1 === c + 1 && r2 === r && c2 === c) return ">";
  }
  return null;
}

function getVertSign(ineqs: FIneq[], r: number, c: number): "∧" | "∨" | null {
  // Between (r,c) and (r+1,c)
  for (const { r1, c1, r2, c2 } of ineqs) {
    if (r1 === r && c1 === c && r2 === r + 1 && c2 === c) return "∨"; // top < bottom
    if (r1 === r + 1 && c1 === c && r2 === r && c2 === c) return "∧"; // bottom < top
  }
  return null;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(grid: FGrid, ineqs: FIneq[]): { errors: Set<string>; complete: boolean } {
  const errors = new Set<string>();
  let allFilled = true;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      if (v === null) { allFilled = false; continue; }

      // Row dup
      for (let i = 0; i < N; i++)
        if (i !== c && grid[r][i] === v) { errors.add(`${r},${c}`); errors.add(`${r},${i}`); }
      // Col dup
      for (let i = 0; i < N; i++)
        if (i !== r && grid[i][c] === v) { errors.add(`${r},${c}`); errors.add(`${i},${c}`); }
    }
  }

  // Inequality violations
  for (const { r1, c1, r2, c2 } of ineqs) {
    const a = grid[r1][c1], b = grid[r2][c2];
    if (a !== null && b !== null && a >= b) {
      errors.add(`${r1},${c1}`); errors.add(`${r2},${c2}`);
    }
  }

  return { errors, complete: allFilled && errors.size === 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────

function FutoshikiGame() {
  const [puzzle, setPuzzle] = useState<FGrid>(() => Array.from({ length: N }, () => Array(N).fill(null)));
  const [solution, setSolution] = useState<FGrid>(() => Array.from({ length: N }, () => Array(N).fill(null)));
  const [userGrid, setUserGrid] = useState<FGrid>(() => Array.from({ length: N }, () => Array(N).fill(null)));
  const [ineqs, setIneqs] = useState<FIneq[]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    const { puzzle, solution, ineqs } = generatePuzzle();
    setPuzzle(deepCopyGrid(puzzle));
    setSolution(deepCopyGrid(solution));
    setUserGrid(deepCopyGrid(puzzle));
    setIneqs(ineqs);
    setSelected(null);
    setErrors(new Set());
    setWon(false);
  }, []);

  useEffect(() => { startGame(); }, [startGame]);

  const inputNumber = useCallback((val: number | null) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== null) return;

    const newGrid = deepCopyGrid(userGrid);
    newGrid[r][c] = val;
    setUserGrid(newGrid);

    const { errors: errs, complete } = validate(newGrid, ineqs);
    setErrors(errs);
    if (complete) setWon(true);
  }, [selected, won, puzzle, userGrid, ineqs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= "1" && e.key <= "5") { e.preventDefault(); inputNumber(parseInt(e.key)); }
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") inputNumber(null);
      else if (e.key === "ArrowUp"    && r > 0) { e.preventDefault(); setSelected([r - 1, c]); }
      else if (e.key === "ArrowDown"  && r < N - 1) { e.preventDefault(); setSelected([r + 1, c]); }
      else if (e.key === "ArrowLeft"  && c > 0) { e.preventDefault(); setSelected([r, c - 1]); }
      else if (e.key === "ArrowRight" && c < N - 1) { e.preventDefault(); setSelected([r, c + 1]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber]);

  const isIneqError = useCallback((r1: number, c1: number, r2: number, c2: number): boolean => {
    return errors.has(`${r1},${c1}`) && errors.has(`${r2},${c2}`);
  }, [errors]);

  const CELL = 52;
  const GAP  = 20;

  // Build 9×9 positions: cells at even indices, gaps at odd
  const gridItems: JSX.Element[] = [];

  for (let gi = 0; gi < 9; gi++) {
    for (let gj = 0; gj < 9; gj++) {
      const isCell = gi % 2 === 0 && gj % 2 === 0;
      const isHGap = gi % 2 === 0 && gj % 2 === 1;
      const isVGap = gi % 2 === 1 && gj % 2 === 0;

      if (isCell) {
        const r = gi / 2, c = gj / 2;
        const val = userGrid[r][c];
        const isGiven = puzzle[r][c] !== null;
        const isSel   = selected?.[0] === r && selected?.[1] === c;
        const isErr   = errors.has(`${r},${c}`);

        let bg = "#ffffff";
        if (isSel)     bg = "#e9d5ff"; // lilac-200
        else if (isErr) bg = "#fee2e2"; // red-100

        gridItems.push(
          <div key={`c${r}${c}`}
            onClick={() => !isGiven && !won && setSelected([r, c])}
            style={{
              width: CELL, height: CELL,
              background: bg,
              border: "2px solid #a78bfa",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: isGiven ? "default" : "pointer",
              transition: "background 0.15s",
              boxShadow: isSel ? "0 0 0 3px #7c3aed" : undefined,
            }}>
            <span style={{
              fontSize: "1.35rem",
              fontWeight: isGiven ? 800 : 600,
              color: isErr ? "#ef4444" : isGiven ? "#1e1b4b" : "#7c3aed",
            }}>
              {val ?? ""}
            </span>
          </div>
        );
      } else if (isHGap) {
        const r = gi / 2, c = (gj - 1) / 2;
        const sign = getHorizSign(ineqs, r, c);
        const err = sign && isIneqError(
          r, c,
          r, c + 1
        ) && (sign === "<"
          ? isIneqError(r, c, r, c + 1)
          : isIneqError(r, c + 1, r, c));

        gridItems.push(
          <div key={`h${r}${c}`}
            style={{ width: GAP, height: CELL, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sign && (
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: err ? "#ef4444" : "#a78bfa" }}>
                {sign}
              </span>
            )}
          </div>
        );
      } else if (isVGap) {
        const r = (gi - 1) / 2, c = gj / 2;
        const sign = getVertSign(ineqs, r, c);
        const err = sign && (sign === "∨"
          ? isIneqError(r, c, r + 1, c)
          : isIneqError(r + 1, c, r, c));

        gridItems.push(
          <div key={`v${r}${c}`}
            style={{ width: CELL, height: GAP, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sign && (
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: err ? "#ef4444" : "#a78bfa" }}>
                {sign}
              </span>
            )}
          </div>
        );
      } else {
        // Corner gap — empty
        gridItems.push(<div key={`x${gi}${gj}`} style={{ width: GAP, height: GAP }} />);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay show={won} onPlayAgain={startGame} message="Futoshiki Solved!" sub="All inequalities satisfied!" />

      <p className="text-xs text-slate-400 max-w-xs text-center">
        Fill each row and column with <strong>1–5</strong> (no repeats).
        Inequality signs between cells must be respected.{" "}
        <strong>∨</strong> = upper cell is smaller, <strong>∧</strong> = upper cell is larger.
      </p>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(5, ${CELL}px ${GAP}px) ${CELL}px`,
        gridTemplateRows:    `repeat(5, ${CELL}px ${GAP}px) ${CELL}px`,
        gap: 0,
      }}>
        {gridItems}
      </div>

      {/* Number pad */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => inputNumber(n)}
            className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200
              text-purple-700 font-bold text-base transition-colors">
            {n}
          </button>
        ))}
        <button onClick={() => inputNumber(null)}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200
            text-slate-400 font-bold transition-colors">
          ✕
        </button>
      </div>

      <button onClick={startGame}
        className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm transition-colors shadow-md shadow-purple-200">
        New Game
      </button>

      <p className="text-xs text-slate-400">
        Click a cell · type 1–5 · arrow keys to navigate
      </p>
    </div>
  );
}

// ─── Game Registration ────────────────────────────────────────────────────────

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
