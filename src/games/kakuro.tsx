import { Calculator } from "lucide-react";
import type { Game } from "./types";
import { useCallback, useEffect, useState } from "react";
import { WinOverlay } from "./_WinOverlay";
import { DevComplete } from "./_DevComplete";

// ─── Kakuro ───────────────────────────────────────────────────────────────────
// Each fill cell holds 1-9. Every horizontal/vertical run sums to its clue
// and contains no duplicate digits.

type CellKind = "block" | "fill";
interface CellDef {
  kind: CellKind;
  // For block cells: optional clues
  rightClue?: number; // sum for the run starting to the right
  downClue?: number; // sum for the run starting below
  // For fill cells: the answer
  solution?: number;
}

interface Puzzle {
  rows: number;
  cols: number;
  cells: CellDef[][];
}

// Layout:
// (0,0)B (0,1)d=12 (0,2)d=18 (0,3)d=22 (0,4)B
// (1,0)r=6  F      F          F         B
// (2,0)r=15 F      F          F         B
// (3,0)r=26 F      F          F         d=7
// (4,0)B    r=12   F          F         F
const PUZZLE: Puzzle = {
  rows: 5,
  cols: 5,
  cells: [
    [
      { kind: "block" },
      { kind: "block", downClue: 12 },
      { kind: "block", downClue: 18 },
      { kind: "block", downClue: 22 },
      { kind: "block" },
    ],
    [
      { kind: "block", rightClue: 6 },
      { kind: "fill", solution: 1 },
      { kind: "fill", solution: 2 },
      { kind: "fill", solution: 3 },
      { kind: "block" },
    ],
    [
      { kind: "block", rightClue: 15 },
      { kind: "fill", solution: 4 },
      { kind: "fill", solution: 5 },
      { kind: "fill", solution: 6 },
      { kind: "block" },
    ],
    [
      { kind: "block", rightClue: 26 },
      { kind: "fill", solution: 7 },
      { kind: "fill", solution: 8 },
      { kind: "fill", solution: 9 },
      { kind: "block", downClue: 7 },
    ],
    [
      { kind: "block" },
      { kind: "block", rightClue: 12 },
      { kind: "fill", solution: 3 },
      { kind: "fill", solution: 4 },
      { kind: "fill", solution: 5 },
    ],
  ],
};

// Cells the user must fill; we map (r,c) -> value.
type UserGrid = Record<string, number | null>;

function fillKey(r: number, c: number) {
  return `${r},${c}`;
}

function emptyUserGrid(p: Puzzle): UserGrid {
  const g: UserGrid = {};
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.cells[r][c].kind === "fill") g[fillKey(r, c)] = null;
    }
  }
  return g;
}

// Compute runs (horizontal & vertical) and check sums + duplicates.
function getErrors(p: Puzzle, ug: UserGrid): Set<string> {
  const errs = new Set<string>();

  // Horizontal runs starting after a right clue
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const cell = p.cells[r][c];
      if (cell.kind === "block" && cell.rightClue !== undefined) {
        const run: [number, number, number | null][] = [];
        let cc = c + 1;
        while (cc < p.cols && p.cells[r][cc].kind === "fill") {
          run.push([r, cc, ug[fillKey(r, cc)] ?? null]);
          cc++;
        }
        // Check duplicates
        const seen = new Map<number, number>();
        for (const [rr, ccc, v] of run) {
          if (v === null) continue;
          if (seen.has(v)) {
            errs.add(fillKey(rr, ccc));
            errs.add(fillKey(rr, seen.get(v)!));
          }
          seen.set(v, ccc);
        }
        // Sum check (only if all filled)
        if (run.every(([, , v]) => v !== null)) {
          const sum = run.reduce((a, [, , v]) => a + (v as number), 0);
          if (sum !== cell.rightClue) {
            for (const [rr, ccc] of run) errs.add(fillKey(rr, ccc));
          }
        }
      }

      if (cell.kind === "block" && cell.downClue !== undefined) {
        const run: [number, number, number | null][] = [];
        let rr = r + 1;
        while (rr < p.rows && p.cells[rr][c].kind === "fill") {
          run.push([rr, c, ug[fillKey(rr, c)] ?? null]);
          rr++;
        }
        const seen = new Map<number, number>();
        for (const [rrr, cc, v] of run) {
          if (v === null) continue;
          if (seen.has(v)) {
            errs.add(fillKey(rrr, cc));
            errs.add(fillKey(seen.get(v)!, cc));
          }
          seen.set(v, rrr);
        }
        if (run.every(([, , v]) => v !== null)) {
          const sum = run.reduce((a, [, , v]) => a + (v as number), 0);
          if (sum !== cell.downClue) {
            for (const [rrr, cc] of run) errs.add(fillKey(rrr, cc));
          }
        }
      }
    }
  }
  return errs;
}

function KakuroGame() {
  const [userGrid, setUserGrid] = useState<UserGrid>(() => emptyUserGrid(PUZZLE));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    setUserGrid(emptyUserGrid(PUZZLE));
    setSelected(null);
    setWon(false);
  }, []);

  const errors = getErrors(PUZZLE, userGrid);

  const inputNumber = useCallback(
    (num: number | null) => {
      if (!selected || won) return;
      const [r, c] = selected;
      if (PUZZLE.cells[r][c].kind !== "fill") return;
      setUserGrid((prev) => ({ ...prev, [fillKey(r, c)]: num }));
    },
    [selected, won],
  );

  // Move selection to next/prev fill cell
  const moveSelection = useCallback(
    (dr: number, dc: number) => {
      if (!selected) return;
      let [r, c] = selected;
      while (true) {
        r += dr;
        c += dc;
        if (r < 0 || r >= PUZZLE.rows || c < 0 || c >= PUZZLE.cols) return;
        if (PUZZLE.cells[r][c].kind === "fill") {
          setSelected([r, c]);
          return;
        }
      }
    },
    [selected],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        inputNumber(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        inputNumber(null);
      } else if (e.key === "ArrowUp") moveSelection(-1, 0);
      else if (e.key === "ArrowDown") moveSelection(1, 0);
      else if (e.key === "ArrowLeft") moveSelection(0, -1);
      else if (e.key === "ArrowRight") moveSelection(0, 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber, moveSelection]);

  // Win check
  useEffect(() => {
    if (won) return;
    for (let r = 0; r < PUZZLE.rows; r++) {
      for (let c = 0; c < PUZZLE.cols; c++) {
        const cell = PUZZLE.cells[r][c];
        if (cell.kind === "fill") {
          if (userGrid[fillKey(r, c)] !== cell.solution) return;
        }
      }
    }
    setWon(true);
  }, [userGrid, won]);

  const completePuzzle = useCallback(() => {
    const g: UserGrid = {};
    for (let r = 0; r < PUZZLE.rows; r++) {
      for (let c = 0; c < PUZZLE.cols; c++) {
        const cell = PUZZLE.cells[r][c];
        if (cell.kind === "fill") g[fillKey(r, c)] = cell.solution!;
      }
    }
    setUserGrid(g);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      <WinOverlay
        show={won}
        onPlayAgain={startGame}
        message="Kakuro Solved!"
        sub="Every sum lines up. Pure logic — no luck involved."
      />

      <div
        className="rounded-2xl overflow-hidden shadow-xl border-2 border-rose-700 bg-rose-900"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 3.25rem)",
          gridTemplateRows: "repeat(5, 3.25rem)",
          gap: "1px",
        }}
      >
        {Array.from({ length: PUZZLE.rows }, (_, r) =>
          Array.from({ length: PUZZLE.cols }, (_, c) => {
            const cell = PUZZLE.cells[r][c];
            if (cell.kind === "block") {
              const hasClue = cell.rightClue !== undefined || cell.downClue !== undefined;
              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-rose-900 text-white relative"
                  style={{ width: "3.25rem", height: "3.25rem" }}
                >
                  {hasClue && (
                    <>
                      {/* diagonal divider */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                      </svg>
                      {cell.rightClue !== undefined && (
                        <div
                          className="absolute font-bold text-xs"
                          style={{ top: "2px", right: "4px" }}
                        >
                          {cell.rightClue}
                        </div>
                      )}
                      {cell.downClue !== undefined && (
                        <div
                          className="absolute font-bold text-xs"
                          style={{ bottom: "2px", left: "4px" }}
                        >
                          {cell.downClue}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            }
            // fill cell
            const v = userGrid[fillKey(r, c)];
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isErr = errors.has(fillKey(r, c));
            const bg = isSel ? "bg-rose-300" : isErr ? "bg-red-100" : "bg-white";
            const text = isErr ? "text-red-500" : "text-rose-700 font-bold";
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => !won && setSelected([r, c])}
                className={`flex items-center justify-center cursor-pointer text-lg transition-colors ${bg} ${text}`}
              >
                {v ?? ""}
              </div>
            );
          }),
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => inputNumber(n)}
            className="w-9 h-9 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => inputNumber(null)}
          className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startGame}
          className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors shadow-md shadow-rose-200"
        >
          Reset
        </button>
        {/* DEV: comment out the next line to remove the dev complete button */}
        <DevComplete onComplete={completePuzzle} />
      </div>

      <p className="text-xs text-slate-400 text-center max-w-md">
        Fill each white cell with 1–9. Each run must sum to its clue (top-right
        for across, bottom-left for down) with no repeated digits in a run.
      </p>
    </div>
  );
}

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
