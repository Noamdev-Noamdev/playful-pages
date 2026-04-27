import { Calculator } from "lucide-react";
import type { Game } from "./types";
import { useState, useCallback, useEffect, useMemo } from "react";
import { WinOverlay } from "./_WinOverlay";

// ─── Cell Types ───────────────────────────────────────────────────────────────

type KCell =
  | { k: "B" }                                      // solid black
  | { k: "C"; a: number | null; d: number | null }  // clue: a=across, d=down
  | { k: "W"; given?: number };                      // white (playable)

type PuzzleDef = { label: string; grid: KCell[][] };

// ─── Verified Puzzles ─────────────────────────────────────────────────────────
//
// All three puzzles are fully hand-verified.
// Validation is constraint-based (correct sums, no duplicate digits per run)
// so any valid alternative solution is also accepted.
//
// Puzzle 1 — 3×3 white block (Beginner, 4×4 grid)
// Solution:  1 2 6 | 3 5 4 | 8 7 9
// Row sums:  9, 12, 24   Col sums: 12, 14, 19
//
// Puzzle 2 — 4×4 white block (Medium, 5×5 grid)
// Solution:  3 5 2 7 | 6 1 8 4 | 2 7 4 9 | 1 4 6 5
// Row sums:  17,19,22,16  Col sums: 12,17,20,25
//
// Puzzle 3 — 4×5 white block (Hard, 5×6 grid)
// Solution:  1 3 5 7 9 | 2 8 4 6 3 | 6 4 9 1 5 | 4 2 7 8 6
// Row sums:  25,23,25,27  Col sums: 13,17,25,22,23

const PUZZLES: PuzzleDef[] = [
  {
    label: "Beginner",
    grid: [
      [{ k: "B" }, { k: "C", a: null, d: 12 }, { k: "C", a: null, d: 14 }, { k: "C", a: null, d: 19 }],
      [{ k: "C", a: 9,  d: null }, { k: "W" }, { k: "W" }, { k: "W", given: 6 }],
      [{ k: "C", a: 12, d: null }, { k: "W" }, { k: "W" }, { k: "W" }],
      [{ k: "C", a: 24, d: null }, { k: "W", given: 8 }, { k: "W" }, { k: "W" }],
    ],
  },
  {
    label: "Medium",
    grid: [
      [{ k: "B" }, { k: "C", a: null, d: 12 }, { k: "C", a: null, d: 17 }, { k: "C", a: null, d: 20 }, { k: "C", a: null, d: 25 }],
      [{ k: "C", a: 17, d: null }, { k: "W", given: 3 }, { k: "W" }, { k: "W" }, { k: "W" }],
      [{ k: "C", a: 19, d: null }, { k: "W" }, { k: "W" }, { k: "W", given: 8 }, { k: "W" }],
      [{ k: "C", a: 22, d: null }, { k: "W" }, { k: "W" }, { k: "W" }, { k: "W", given: 9 }],
      [{ k: "C", a: 16, d: null }, { k: "W" }, { k: "W", given: 4 }, { k: "W" }, { k: "W" }],
    ],
  },
  {
    label: "Hard",
    grid: [
      [{ k: "B" }, { k: "C", a: null, d: 13 }, { k: "C", a: null, d: 17 }, { k: "C", a: null, d: 25 }, { k: "C", a: null, d: 22 }, { k: "C", a: null, d: 23 }],
      [{ k: "C", a: 25, d: null }, { k: "W" }, { k: "W" }, { k: "W" }, { k: "W" }, { k: "W", given: 9 }],
      [{ k: "C", a: 23, d: null }, { k: "W" }, { k: "W", given: 8 }, { k: "W" }, { k: "W" }, { k: "W" }],
      [{ k: "C", a: 25, d: null }, { k: "W" }, { k: "W" }, { k: "W", given: 9 }, { k: "W" }, { k: "W" }],
      [{ k: "C", a: 27, d: null }, { k: "W", given: 4 }, { k: "W" }, { k: "W" }, { k: "W" }, { k: "W" }],
    ],
  },
];

// ─── Run Extraction ───────────────────────────────────────────────────────────

type Run = { cells: [number, number][]; sum: number };

function extractRuns(grid: KCell[][]): Run[] {
  const ROWS = grid.length;
  const COLS = grid[0].length;
  const runs: Run[] = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const cell = grid[r][c];
      if (cell.k === "C" && cell.a !== null) {
        const sum = cell.a;
        const cells: [number, number][] = [];
        c++;
        while (c < COLS && grid[r][c].k === "W") { cells.push([r, c]); c++; }
        if (cells.length > 0) runs.push({ cells, sum });
      } else c++;
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const cell = grid[r][c];
      if (cell.k === "C" && cell.d !== null) {
        const sum = cell.d;
        const cells: [number, number][] = [];
        r++;
        while (r < ROWS && grid[r][c].k === "W") { cells.push([r, c]); r++; }
        if (cells.length > 0) runs.push({ cells, sum });
      } else r++;
    }
  }

  return runs;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBoard(
  userVals: (number | null)[][],
  runs: Run[]
): { errors: Set<string>; complete: boolean } {
  const errors = new Set<string>();
  let allFilled = true;

  for (const { cells, sum } of runs) {
    const vals = cells.map(([r, c]) => userVals[r][c]);
    const filled = vals.filter((v) => v !== null) as number[];

    if (filled.length < cells.length) { allFilled = false; continue; }

    // Duplicate check
    const seen = new Set<number>();
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i] as number;
      if (seen.has(v)) {
        // Mark all duplicates in this run
        for (let j = 0; j < vals.length; j++)
          if (vals[j] === v) errors.add(`${cells[j][0]},${cells[j][1]}`);
      }
      seen.add(v);
    }

    // Sum check — only when all filled
    const total = vals.reduce((a, b) => a! + b!, 0) as number;
    if (total !== sum) cells.forEach(([r, c]) => errors.add(`${r},${c}`));
  }

  return { errors, complete: allFilled && errors.size === 0 };
}

// ─── Initial User Grid ────────────────────────────────────────────────────────

function initUserVals(grid: KCell[][]): (number | null)[][] {
  return grid.map((row) =>
    row.map((cell) => {
      if (cell.k === "W") return cell.given ?? null;
      return null;
    })
  );
}

// ─── Clue Cell Renderer ───────────────────────────────────────────────────────

function ClueCell({ a, d, size }: { a: number | null; d: number | null; size: number }) {
  return (
    <div style={{ width: size, height: size, position: "relative", background: "#1e293b", overflow: "hidden" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <line x1={0} y1={0} x2={size} y2={size} stroke="#475569" strokeWidth={1.5} />
      </svg>
      {/* Down clue — top-right */}
      {d !== null && (
        <span style={{
          position: "absolute", top: 3, right: 5,
          fontSize: size * 0.28, fontWeight: 700, color: "#94a3b8", lineHeight: 1,
        }}>{d}</span>
      )}
      {/* Across clue — bottom-left */}
      {a !== null && (
        <span style={{
          position: "absolute", bottom: 3, left: 5,
          fontSize: size * 0.28, fontWeight: 700, color: "#cbd5e1", lineHeight: 1,
        }}>{a}</span>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function KakuroGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLES[puzzleIdx];
  const runs = useMemo(() => extractRuns(puzzle.grid), [puzzle]);

  const [userVals, setUserVals] = useState<(number | null)[][]>(() => initUserVals(puzzle.grid));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const resetPuzzle = useCallback((idx: number) => {
    const p = PUZZLES[idx];
    setUserVals(initUserVals(p.grid));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
  }, []);

  const handlePuzzleChange = (idx: number) => {
    setPuzzleIdx(idx);
    resetPuzzle(idx);
  };

  const handlePlayAgain = () => resetPuzzle(puzzleIdx);

  const inputNumber = useCallback((val: number | null) => {
    if (!selected || won) return;
    const [r, c] = selected;
    const cell = puzzle.grid[r][c];
    if (cell.k !== "W" || cell.given !== undefined) return;

    const newVals = userVals.map((row) => [...row]);
    newVals[r][c] = val;
    setUserVals(newVals);

    const { errors: errs, complete } = validateBoard(newVals, runs);
    setErrors(errs);
    if (complete) setWon(true);
  }, [selected, won, puzzle, userVals, runs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      const ROWS = puzzle.grid.length, COLS = puzzle.grid[0].length;
      if (e.key >= "1" && e.key <= "9") { e.preventDefault(); inputNumber(parseInt(e.key)); }
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") inputNumber(null);
      else if (e.key === "ArrowUp")    { e.preventDefault(); for (let nr = r-1; nr >= 0; nr--) if (puzzle.grid[nr][c].k === "W") { setSelected([nr, c]); break; } }
      else if (e.key === "ArrowDown")  { e.preventDefault(); for (let nr = r+1; nr < ROWS; nr++) if (puzzle.grid[nr][c].k === "W") { setSelected([nr, c]); break; } }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); for (let nc = c-1; nc >= 0; nc--) if (puzzle.grid[r][nc].k === "W") { setSelected([r, nc]); break; } }
      else if (e.key === "ArrowRight") { e.preventDefault(); for (let nc = c+1; nc < COLS; nc++) if (puzzle.grid[r][nc].k === "W") { setSelected([r, nc]); break; } }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber, puzzle]);

  const CELL = 56;

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay show={won} onPlayAgain={handlePlayAgain} message="Kakuro Solved!" sub="All the sums add up perfectly!" />

      {/* Puzzle selector */}
      <div className="flex gap-2">
        {PUZZLES.map((p, i) => (
          <button key={i} onClick={() => handlePuzzleChange(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors
              ${puzzleIdx === i
                ? "bg-coral-500 border-orange-400 bg-orange-500 text-white"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 max-w-xs text-center">
        Fill white cells with <strong>1–9</strong>. Each run must sum to its clue with no repeated digits.
        <br />Clue cell: <span className="font-mono">down \ across</span>.
      </p>

      {/* Grid */}
      <div className="rounded-xl overflow-hidden shadow-xl border-2 border-slate-700"
        style={{ display: "grid", gridTemplateColumns: `repeat(${puzzle.grid[0].length}, ${CELL}px)` }}>
        {puzzle.grid.map((row, r) =>
          row.map((cell, c) => {
            if (cell.k === "B") return (
              <div key={`${r}-${c}`} style={{ width: CELL, height: CELL, background: "#0f172a" }} />
            );
            if (cell.k === "C") return (
              <div key={`${r}-${c}`} style={{ width: CELL, height: CELL }}>
                <ClueCell a={cell.a} d={cell.d} size={CELL} />
              </div>
            );

            // White cell
            const val = userVals[r][c];
            const isGiven = cell.given !== undefined;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isError = errors.has(`${r},${c}`);

            let bg = "#ffffff";
            if (isSelected) bg = "#fed7aa";       // orange-200
            else if (isError) bg = "#fee2e2";      // red-100

            return (
              <div key={`${r}-${c}`}
                onClick={() => { if (!isGiven && !won) setSelected([r, c]); }}
                style={{
                  width: CELL, height: CELL,
                  background: bg,
                  border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: isGiven ? "default" : "pointer",
                  transition: "background 0.15s",
                }}>
                <span style={{
                  fontSize: "1.2rem",
                  fontWeight: isGiven ? 800 : 600,
                  color: isError ? "#ef4444" : isGiven ? "#0f172a" : "#ea580c",
                }}>
                  {val ?? ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div className="flex items-center gap-2">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => inputNumber(n)}
            className="w-9 h-9 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200
              text-orange-700 font-bold text-sm transition-colors">
            {n}
          </button>
        ))}
        <button onClick={() => inputNumber(null)}
          className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200
            text-slate-400 font-bold transition-colors">
          ✕
        </button>
      </div>

      <button onClick={handlePlayAgain}
        className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-md shadow-orange-200">
        Reset Puzzle
      </button>

      <p className="text-xs text-slate-400">
        Click a cell · type 1–9 · arrow keys skip to next white cell
      </p>
    </div>
  );
}

// ─── Game Registration ────────────────────────────────────────────────────────

const Kakuro: Game = {
  slug: "kakuro",
  title: "Kakuro",
  description: "A crossword for math lovers. Make the sums add up.",
  icon: Calculator,
  color: "coral",
  category: "classics",
  Component: KakuroGame,
};

export default Kakuro;
