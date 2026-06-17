// ─── Region Cut — Pure game logic ──────────────────────────────────────────

/** Canonical key for a border between two adjacent cells. Always sorted. */
export function borderKey(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): string {
  if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1}-${r2},${c2}`;
  return `${r2},${c2}-${r1},${c1}`;
}

export interface RegionInfo {
  id: number;
  cells: [number, number][];
  sum: number;
}

/**
 * Flood-fill connected component detection.
 * Two adjacent cells are connected if there is no border between them.
 * Returns a regionMap (regionMap[r][c] = regionId) and an array of RegionInfo.
 */
export function computeRegions(
  rows: number,
  cols: number,
  borders: Set<string>,
): { regionMap: number[][]; regions: RegionInfo[] } {
  const regionMap: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(-1),
  );
  const regions: RegionInfo[] = [];
  let regionId = 0;

  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (regionMap[r][c] !== -1) continue;

      // BFS from this cell
      const cells: [number, number][] = [];
      const queue: [number, number][] = [[r, c]];
      regionMap[r][c] = regionId;

      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        cells.push([cr, cc]);

        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (regionMap[nr][nc] !== -1) continue;

          // Check if there's a border between current cell and neighbor
          const bk = borderKey(cr, cc, nr, nc);
          if (borders.has(bk)) continue;

          regionMap[nr][nc] = regionId;
          queue.push([nr, nc]);
        }
      }

      regions.push({ id: regionId, cells, sum: 0 });
      regionId++;
    }
  }

  return { regionMap, regions };
}

/** Compute region sums given a grid of numbers and region info. */
export function computeRegionSums(
  grid: number[][],
  regions: RegionInfo[],
): void {
  for (const region of regions) {
    let sum = 0;
    for (const [r, c] of region.cells) {
      sum += grid[r][c];
    }
    region.sum = sum;
  }
}

export type RegionState = "valid" | "under" | "over";

/** Determine the state of each region relative to the target sum. */
export function getRegionStates(
  regions: RegionInfo[],
  targetSum: number,
): Map<number, RegionState> {
  const states = new Map<number, RegionState>();
  for (const region of regions) {
    if (region.sum === targetSum) states.set(region.id, "valid");
    else if (region.sum < targetSum) states.set(region.id, "under");
    else states.set(region.id, "over");
  }
  return states;
}

/** Check if the puzzle is solved: every region sums to targetSum. */
export function checkWin(
  regions: RegionInfo[],
  targetSum: number,
): boolean {
  if (regions.length === 0) return false;
  return regions.every((r) => r.sum === targetSum);
}

/**
 * Check placed borders against the solution.
 * Returns { correct, wrong, missing }.
 * - correct: borders that match the solution
 * - wrong: borders placed that are NOT in the solution
 * - missing: borders in the solution not yet placed
 */
export function checkAgainstSolution(
  currentBorders: Set<string>,
  solutionBorders: Set<string>,
): { correct: string[]; wrong: string[]; missing: string[] } {
  const correct: string[] = [];
  const wrong: string[] = [];
  const missing: string[] = [];

  for (const b of currentBorders) {
    if (solutionBorders.has(b)) correct.push(b);
    else wrong.push(b);
  }
  for (const b of solutionBorders) {
    if (!currentBorders.has(b)) missing.push(b);
  }

  return { correct, wrong, missing };
}
