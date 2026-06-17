// ─── Region Cut — Puzzle type and loader ────────────────────────────────────

import { borderKey } from "./logic";

export interface RegionCutPuzzle {
  title: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  grid: number[][];
  targetSum: number;
  solutionBorders: Set<string>;
}

/** Raw shape stored in level JSON files. */
export interface RawRegionCutPuzzle {
  title: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  grid: number[][];
  targetSum: number;
  solutionBorders: string[];
}

/** Convert the raw JSON puzzle into a typed puzzle with a Set for borders. */
export function parsePuzzle(raw: RawRegionCutPuzzle): RegionCutPuzzle {
  return {
    title: raw.title,
    hint: raw.hint,
    difficulty: raw.difficulty,
    grid: raw.grid,
    targetSum: raw.targetSum,
    solutionBorders: new Set(raw.solutionBorders),
  };
}
