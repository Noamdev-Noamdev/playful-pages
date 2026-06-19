// ─── Region Cut — Puzzle type and loader ────────────────────────────────────

export interface RegionCutPuzzle {
  title: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  grid: number[][];
  targetSum: number;
  solutionBorders: Set<string>;
  validSolutionBorders: Set<string>[];
}

/** Raw shape stored in level JSON files. */
export interface RawRegionCutPuzzle {
  title: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  grid: number[][];
  targetSum: number;
  solutionBorders?: string[];
  validSolutionBorders?: string[][];
}

/** Convert the raw JSON puzzle into a typed puzzle with a Set for borders. */
export function parsePuzzle(raw: RawRegionCutPuzzle): RegionCutPuzzle {
  const rawSolutions = raw.validSolutionBorders?.length
    ? raw.validSolutionBorders
    : raw.solutionBorders
      ? [raw.solutionBorders]
      : [];

  const validSolutionBorders = rawSolutions.map((solution) => new Set(solution));

  return {
    title: raw.title,
    hint: raw.hint,
    difficulty: raw.difficulty,
    grid: raw.grid,
    targetSum: raw.targetSum,
    solutionBorders: validSolutionBorders[0] ?? new Set(),
    validSolutionBorders,
  };
}
