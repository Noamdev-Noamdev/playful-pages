import { Hash } from "lucide-react";
import type { Game } from "./types";
import { useState, useCallback, useEffect } from "react";
import { WinOverlay } from "./_WinOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

type Grid = (number | null)[][];

// ─── Sudoku Engine ────────────────────────────────────────────────────────────

function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function deepCopy(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function solve(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) {
        for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(grid, r, c, n)) {
            grid[r][c] = n;
            if (solve(grid)) return true;
            grid[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(clues = 32): { puzzle: Grid; solution: Grid } {
  const solution = emptyGrid();
  solve(solution);

  const puzzle = deepCopy(solution);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let removed = 81 - clues;

  for (const pos of positions) {
    if (removed === 0) break;
    puzzle[Math.floor(pos / 9)][pos % 9] = null;
    removed--;
  }

  return { puzzle, solution };
}

// ─── Component ────────────────────────────────────────────────────────────────

function SudokuGame() {
  const [puzzle, setPuzzle] = useState<Grid>(emptyGrid);
  const [solution, setSolution] = useState<Grid>(emptyGrid);
  const [userGrid, setUserGrid] = useState<Grid>(emptyGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<Set<number>[][][]>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [new Set<number>()])),
  );

  const startGame = useCallback(() => {
    const { puzzle, solution } = generatePuzzle(32);
    setPuzzle(deepCopy(puzzle));
    setSolution(deepCopy(solution));
    setUserGrid(deepCopy(puzzle));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [new Set<number>()])));
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const getConflicts = useCallback((grid: Grid): Set<string> => {
    const errs = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = grid[r][c];
        if (v === null) continue;
        // Row
        for (let i = 0; i < 9; i++) {
          if (i !== c && grid[r][i] === v) {
            errs.add(`${r},${c}`);
            errs.add(`${r},${i}`);
          }
        }
        // Col
        for (let i = 0; i < 9; i++) {
          if (i !== r && grid[i][c] === v) {
            errs.add(`${r},${c}`);
            errs.add(`${i},${c}`);
          }
        }
        // Box
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            if ((rr !== r || cc !== c) && grid[rr][cc] === v) {
              errs.add(`${r},${c}`);
              errs.add(`${rr},${cc}`);
            }
          }
        }
      }
    }
    return errs;
  }, []);

  const inputNumber = useCallback(
    (num: number | null) => {
      if (!selected || won) return;
      const [r, c] = selected;
      if (puzzle[r][c] !== null) return; // given cell

      if (noteMode && num !== null) {
        setNotes((prev) => {
          const next = prev.map((row) => row.map((cell) => [new Set(cell[0])]));
          const s = next[r][c][0];
          if (s.has(num)) {
            s.delete(num);
          } else {
            s.add(num);
          }
          return next;
        });
        return;
      }

      const newGrid = deepCopy(userGrid);
      newGrid[r][c] = num;
      setUserGrid(newGrid);

      // Clear notes for this cell
      setNotes((prev) => {
        const next = prev.map((row) => row.map((cell) => [new Set(cell[0])]));
        next[r][c][0].clear();
        return next;
      });

      const errs = getConflicts(newGrid);
      setErrors(errs);
    },
    [selected, won, puzzle, noteMode, userGrid, getConflicts],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        inputNumber(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        inputNumber(null);
      } else if (e.key === "ArrowUp" && r > 0) {
        e.preventDefault();
        setSelected([r - 1, c]);
      } else if (e.key === "ArrowDown" && r < 8) {
        e.preventDefault();
        setSelected([r + 1, c]);
      } else if (e.key === "ArrowLeft" && c > 0) {
        e.preventDefault();
        setSelected([r, c - 1]);
      } else if (e.key === "ArrowRight" && c < 8) {
        e.preventDefault();
        setSelected([r, c + 1]);
      } else if (e.key === "n" || e.key === "N") {
        setNoteMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, inputNumber]);

  // Check for win condition after grid updates.
  // Compare against solution directly (don't depend on `errors` state which lags by 1 render).
  useEffect(() => {
    if (won) return;
    if (solution[0][0] === null) return; // not initialized yet

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (userGrid[r][c] !== solution[r][c]) return;
      }
    }
    setWon(true);
  }, [userGrid, solution, won]);

  // ── Cell styling ──────────────────────────────────────────────────────────

  const selVal = selected ? userGrid[selected[0]][selected[1]] : null;

  const getCellClasses = (r: number, c: number) => {
    const isSelected = selected?.[0] === r && selected?.[1] === c;
    const isGiven = puzzle[r][c] !== null;
    const isError = errors.has(`${r},${c}`);
    const cellVal = userGrid[r][c];
    const isSameNum = !isSelected && selVal !== null && cellVal === selVal;
    const isPeer =
      selected &&
      (selected[0] === r ||
        selected[1] === c ||
        (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
          Math.floor(selected[1] / 3) === Math.floor(c / 3)));

    // Background
    let bg = "bg-white";
    if (isSelected) bg = "bg-sky-300";
    else if (isError) bg = "bg-red-100";
    else if (isSameNum) bg = "bg-sky-200";
    else if (isPeer) bg = "bg-sky-50";

    // Text
    const text = isError
      ? "text-red-500"
      : isGiven
        ? "text-slate-800 font-bold"
        : "text-sky-600 font-semibold";

    // Thick borders at box boundaries
    const borderR =
      c === 2 || c === 5
        ? "border-r-2 border-r-slate-500"
        : c === 8
          ? ""
          : "border-r border-r-slate-200";
    const borderB =
      r === 2 || r === 5
        ? "border-b-2 border-b-slate-500"
        : r === 8
          ? ""
          : "border-b border-b-slate-200";

    return `relative flex items-center justify-center cursor-pointer text-base transition-colors
      ${bg} ${text} ${borderR} ${borderB}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">
      {/* Win overlay with confetti */}
      <WinOverlay
        show={won}
        onPlayAgain={startGame}
        message="Sudoku Solved!"
        sub="Congratulations! You completed the puzzle."
      />

      {/* Grid */}
      <div
        className="border-2 border-slate-600 rounded-xl overflow-hidden shadow-xl"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 2.5rem)",
          gridTemplateRows: "repeat(9, 2.5rem)",
        }}
      >
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => {
            const val = userGrid[r][c];
            const noteSet = notes[r][c][0];
            return (
              <div
                key={`${r}-${c}`}
                className={getCellClasses(r, c)}
                style={{ width: "2.5rem", height: "2.5rem" }}
                onClick={() => !won && setSelected([r, c])}
              >
                {val !== null ? (
                  <span>{val}</span>
                ) : noteSet.size > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      width: "100%",
                      height: "100%",
                      padding: "2px",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span
                        key={n}
                        style={{ fontSize: "0.45rem", lineHeight: 1 }}
                        className={`flex items-center justify-center ${
                          noteSet.has(n) ? "text-slate-500" : "text-transparent"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }),
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Note mode toggle */}
        <button
          onClick={() => setNoteMode((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border
            ${
              noteMode
                ? "bg-amber-400 border-amber-500 text-amber-900"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
        >
          ✏️ Notes {noteMode ? "ON" : "OFF"}
        </button>

        {/* Number pad */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => inputNumber(n)}
            className="w-9 h-9 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200
              text-sky-700 font-bold text-sm transition-colors"
          >
            {n}
          </button>
        ))}

        {/* Erase */}
        <button
          onClick={() => inputNumber(null)}
          className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200
            text-slate-400 text-base font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* New game */}
      <button
        onClick={startGame}
        className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700
          text-white font-semibold text-sm transition-colors shadow-md shadow-sky-200"
      >
        New Game
      </button>

      <p className="text-xs text-slate-400">
        {"Click a cell · type 1–9 · arrows to move · "}
        <kbd className="bg-slate-100 px-1 rounded">N</kbd>
        {" toggles notes"}
      </p>
    </div>
  );
}

// ─── Game Registration ────────────────────────────────────────────────────────

const Sudoku: Game = {
  slug: "sudoku",
  title: "Sudoku",
  description: "Nine squares, nine numbers, nine ways to lose track of time.",
  icon: Hash,
  color: "sky",
  category: "classics",
  Component: SudokuGame,
};

export default Sudoku;
