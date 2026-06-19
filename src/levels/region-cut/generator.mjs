import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GS = 6;
const CELL_COUNT = GS * GS;
const MAX_TARGET_SUM = 12;
const MAX_VALID_SOLUTIONS = 3;
const DEFAULT_MAX_CELL_VALUE = 4;
const ALL_CELL_INDICES = Array.from({ length: CELL_COUNT }, (_, index) => index);
const FULL_MASK = (1n << BigInt(CELL_COUNT)) - 1n;

const TITLE_OPENERS = [
  "Balanced",
  "Careful",
  "Clean",
  "Clever",
  "Measured",
  "Precise",
  "Quiet",
  "Steady",
];
const TITLE_ENDINGS = [
  "Cut",
  "Divide",
  "Partition",
  "Pattern",
  "Split",
  "Sweep",
  "Tiling",
  "Trace",
];

const NEIGHBORS = Array.from({ length: CELL_COUNT }, (_, index) => {
  const r = Math.floor(index / GS);
  const c = index % GS;
  const out = [];
  if (r > 0) out.push(index - GS);
  if (r < GS - 1) out.push(index + GS);
  if (c > 0) out.push(index - 1);
  if (c < GS - 1) out.push(index + 1);
  return out;
});

export function parseISODate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): ${date}`);
  }
  return date;
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function formatLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addLocalDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function randInt(rand, n) {
  return Math.floor(rand() * n);
}

function randBetween(rand, min, max) {
  return min + randInt(rand, max - min + 1);
}

function pickOne(rand, values) {
  return values[randInt(rand, values.length)];
}

function shuffle(rand, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(rand, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function bit(index) {
  return 1n << BigInt(index);
}

function lowestSetBitIndex(mask) {
  for (let index = 0; index < CELL_COUNT; index++) {
    if ((mask & bit(index)) !== 0n) return index;
  }
  return -1;
}

function borderKey(r1, c1, r2, c2) {
  if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1}-${r2},${c2}`;
  return `${r2},${c2}-${r1},${c1}`;
}

function indicesToGrid(values) {
  return Array.from({ length: GS }, (_, r) => values.slice(r * GS, (r + 1) * GS));
}

function normalizeBorderList(borders) {
  return [...borders].sort();
}

function normalizeSolutionLists(solutionLists) {
  const unique = new Map();
  for (const solution of solutionLists) {
    const normalized = normalizeBorderList(solution);
    unique.set(normalized.join("|"), normalized);
  }
  return [...unique.values()].sort((a, b) => a.join("|").localeCompare(b.join("|")));
}

function compareBorderSetsAgainstSolutions(currentBorders, solutionLists) {
  const normalizedCurrent = new Set(currentBorders);
  const comparisons = solutionLists.map((solution) => {
    const solutionSet = new Set(solution);
    let wrong = 0;
    let missing = 0;

    for (const border of normalizedCurrent) {
      if (!solutionSet.has(border)) wrong++;
    }
    for (const border of solutionSet) {
      if (!normalizedCurrent.has(border)) missing++;
    }

    return {
      wrong,
      missing,
      compatible: wrong === 0,
      exact: wrong === 0 && missing === 0,
    };
  });

  const exactMatch = comparisons.find((comparison) => comparison.exact);
  if (exactMatch) return exactMatch;

  const partialMatch = comparisons
    .filter((comparison) => comparison.compatible)
    .sort((a, b) => a.missing - b.missing)[0];

  return (
    partialMatch ??
    comparisons.sort((a, b) => a.wrong - b.wrong || a.missing - b.missing)[0] ?? {
      wrong: normalizedCurrent.size,
      missing: 0,
      compatible: false,
      exact: false,
    }
  );
}

function canComposeCount(total, minSize, maxSize, memo = new Map()) {
  const key = `${total}:${minSize}:${maxSize}`;
  if (memo.has(key)) return memo.get(key);
  if (total === 0) return true;
  if (total < minSize) return false;

  for (let size = minSize; size <= maxSize; size++) {
    if (size > total) break;
    if (canComposeCount(total - size, minSize, maxSize, memo)) {
      memo.set(key, true);
      return true;
    }
  }

  memo.set(key, false);
  return false;
}

function getUnassignedComponentSizes(unassigned) {
  const remaining = new Set(unassigned);
  const sizes = [];

  while (remaining.size > 0) {
    const [start] = remaining;
    const queue = [start];
    remaining.delete(start);
    let size = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      size++;
      for (const next of NEIGHBORS[current]) {
        if (!remaining.has(next)) continue;
        remaining.delete(next);
        queue.push(next);
      }
    }

    sizes.push(size);
  }

  return sizes;
}

function chooseFeasibleRegionSizes(remainingCount, minSize, maxSize) {
  const sizes = [];
  for (let size = minSize; size <= Math.min(maxSize, remainingCount); size++) {
    const remainder = remainingCount - size;
    if (canComposeCount(remainder, minSize, maxSize)) sizes.push(size);
  }
  return sizes;
}

function growConnectedRegion(rand, unassigned, targetSize) {
  const anchor = pickOne(rand, [...unassigned]);
  const region = new Set([anchor]);
  const frontier = new Set(NEIGHBORS[anchor].filter((index) => unassigned.has(index)));

  while (region.size < targetSize) {
    const choices = [...frontier].filter((index) => !region.has(index));
    if (choices.length === 0) return null;

    const next = pickOne(rand, choices);
    region.add(next);
    frontier.delete(next);

    for (const neighbor of NEIGHBORS[next]) {
      if (unassigned.has(neighbor) && !region.has(neighbor)) frontier.add(neighbor);
    }
  }

  return region;
}

function randomComposition(rand, total, parts, maxValue) {
  if (parts < 1) return null;
  if (parts > total) return null;
  if (parts * maxValue < total) return null;

  const values = [];
  let remaining = total;

  for (let index = 0; index < parts; index++) {
    const partsLeft = parts - index - 1;
    const minValue = Math.max(1, remaining - partsLeft * maxValue);
    const maxAllowed = Math.min(maxValue, remaining - partsLeft);
    const value = randBetween(rand, minValue, maxAllowed);
    values.push(value);
    remaining -= value;
  }

  return shuffle(rand, values);
}

function buildGridFromPartition(rand, regions, targetSum, maxCellValue) {
  const flat = new Array(CELL_COUNT).fill(0);

  for (const region of regions) {
    const values = randomComposition(rand, targetSum, region.length, maxCellValue);
    if (!values) return null;

    const regionCells = shuffle(rand, region);
    for (let index = 0; index < regionCells.length; index++) {
      flat[regionCells[index]] = values[index];
    }
  }

  return indicesToGrid(flat);
}

function buildBordersFromRegionMasks(regionMasks) {
  const regionByCell = new Array(CELL_COUNT).fill(-1);
  regionMasks.forEach((mask, regionId) => {
    for (let index = 0; index < CELL_COUNT; index++) {
      if ((mask & bit(index)) !== 0n) regionByCell[index] = regionId;
    }
  });

  const borders = [];
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      const index = r * GS + c;
      if (c < GS - 1) {
        const right = index + 1;
        if (regionByCell[index] !== regionByCell[right]) {
          borders.push(borderKey(r, c, r, c + 1));
        }
      }
      if (r < GS - 1) {
        const down = index + GS;
        if (regionByCell[index] !== regionByCell[down]) {
          borders.push(borderKey(r, c, r + 1, c));
        }
      }
    }
  }

  return normalizeBorderList(borders);
}

function enumerateConnectedRegionMasks(values, targetSum, availableMask, rootIndex) {
  const rootValue = values[rootIndex];
  if (rootValue > targetSum) return [];

  const results = [];
  const rootMask = bit(rootIndex);
  const initialUntried = NEIGHBORS[rootIndex]
    .filter((index) => index > rootIndex && (availableMask & bit(index)) !== 0n)
    .sort((a, b) => a - b);

  if (rootValue === targetSum) results.push(rootMask);

  const dfs = (regionMask, regionSum, untried, forbiddenMask) => {
    const localUntried = [...untried];
    let localForbidden = forbiddenMask;

    while (localUntried.length > 0) {
      const next = localUntried.shift();
      const nextBit = bit(next);
      const nextSum = regionSum + values[next];

      if (nextSum <= targetSum) {
        const nextMask = regionMask | nextBit;
        if (nextSum === targetSum) {
          results.push(nextMask);
        } else {
          const nextUntried = [...localUntried];
          for (const neighbor of NEIGHBORS[next]) {
            const neighborBit = bit(neighbor);
            if (neighbor <= rootIndex) continue;
            if ((availableMask & neighborBit) === 0n) continue;
            if ((nextMask & neighborBit) !== 0n) continue;
            if ((localForbidden & neighborBit) !== 0n) continue;
            if (!nextUntried.includes(neighbor)) nextUntried.push(neighbor);
          }
          nextUntried.sort((a, b) => a - b);
          dfs(nextMask, nextSum, nextUntried, localForbidden);
        }
      }

      localForbidden |= nextBit;
    }
  };

  dfs(rootMask, rootValue, initialUntried, 0n);
  return results;
}

export function collectRegionCutSolutions(grid, targetSum, limit = MAX_VALID_SOLUTIONS + 1) {
  const values = grid.flat();
  const solutions = [];

  const dfs = (availableMask, regionMasks) => {
    if (solutions.length >= limit) return;
    if (availableMask === 0n) {
      solutions.push(buildBordersFromRegionMasks(regionMasks));
      return;
    }

    const rootIndex = lowestSetBitIndex(availableMask);
    const candidateMasks = enumerateConnectedRegionMasks(
      values,
      targetSum,
      availableMask,
      rootIndex,
    ).sort((a, b) => Number(a.toString(2).length - b.toString(2).length));

    for (const candidateMask of candidateMasks) {
      dfs(availableMask ^ candidateMask, [...regionMasks, candidateMask]);
      if (solutions.length >= limit) return;
    }
  };

  dfs(FULL_MASK, []);
  return normalizeSolutionLists(solutions).slice(0, limit);
}

export function validateRegionCutLevel(
  level,
  { maxTargetSum = MAX_TARGET_SUM, maxSolutions = MAX_VALID_SOLUTIONS } = {},
) {
  const targetWithinLimit = level.targetSum <= maxTargetSum;
  const gridWithinLimit = level.grid.flat().every((value) => value <= maxTargetSum);
  const actualSolutions = collectRegionCutSolutions(level.grid, level.targetSum, maxSolutions + 1);
  const storedSolutions = normalizeSolutionLists(
    level.validSolutionBorders ?? [level.solutionBorders],
  );

  return {
    targetWithinLimit,
    gridWithinLimit,
    actualSolutions,
    storedSolutions,
    solutionCount: actualSolutions.length,
    solutionCountWithinLimit:
      actualSolutions.length >= 1 &&
      actualSolutions.length <= Math.min(maxSolutions, MAX_VALID_SOLUTIONS),
    storedSolutionsMatch:
      actualSolutions.length === storedSolutions.length &&
      actualSolutions.every(
        (solution, index) => solution.join("|") === storedSolutions[index].join("|"),
      ),
  };
}

function classifyDifficulty({ targetSum, solutionCount, regionCount }) {
  if (solutionCount === 1 && targetSum <= 8 && regionCount <= 10) return "easy";
  if (solutionCount <= 2 && targetSum <= 10 && regionCount <= 12) return "medium";
  return "hard";
}

function buildTitle(rand) {
  return `${pickOne(rand, TITLE_OPENERS)} ${pickOne(rand, TITLE_ENDINGS)}`;
}

function buildHint(targetSum, solutionCount) {
  return solutionCount === 1
    ? `Split the grid into connected regions that each sum to ${targetSum}.`
    : `There are a few clean ways through this one, but every valid region still sums to ${targetSum}.`;
}

function generateRandomPartition(
  rand,
  { targetSum, maxCellValue, maxRegionSize, maxPartitionAttempts, maxRegionGrowthAttempts },
) {
  const minRegionSize = Math.ceil(targetSum / maxCellValue);
  const boundedMaxRegionSize = Math.min(maxRegionSize, targetSum, CELL_COUNT);

  for (let attempt = 0; attempt < maxPartitionAttempts; attempt++) {
    let unassigned = new Set(ALL_CELL_INDICES);
    const regions = [];
    let failed = false;

    while (unassigned.size > 0) {
      const feasibleSizes = chooseFeasibleRegionSizes(
        unassigned.size,
        minRegionSize,
        boundedMaxRegionSize,
      );

      if (feasibleSizes.length === 0) {
        failed = true;
        break;
      }

      let placed = false;
      for (let growthAttempt = 0; growthAttempt < maxRegionGrowthAttempts; growthAttempt++) {
        const regionSize = pickOne(rand, feasibleSizes);
        const region = growConnectedRegion(rand, unassigned, regionSize);
        if (!region) continue;

        const nextUnassigned = new Set(unassigned);
        for (const index of region) nextUnassigned.delete(index);

        const componentSizes = getUnassignedComponentSizes(nextUnassigned);
        const componentsComposable = componentSizes.every((size) =>
          canComposeCount(size, minRegionSize, boundedMaxRegionSize),
        );

        if (!componentsComposable) continue;

        regions.push([...region]);
        unassigned = nextUnassigned;
        placed = true;
        break;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed && regions.length > 0) return regions;
  }

  return null;
}

export function generateRegionCutLevel(
  rand,
  {
    date,
    title = null,
    hint = null,
    targetMin = 8,
    targetMax = MAX_TARGET_SUM,
    maxTargetSum = MAX_TARGET_SUM,
    maxSolutions = MAX_VALID_SOLUTIONS,
    preferUnique = true,
    maxCellValue = DEFAULT_MAX_CELL_VALUE,
    maxRegionSize = 6,
    maxLevelAttempts = 800,
    maxPartitionAttempts = 120,
    maxRegionGrowthAttempts = 50,
  } = {},
) {
  parseISODate(date);
  const boundedTargetMax = Math.min(targetMax, maxTargetSum, MAX_TARGET_SUM);
  const boundedTargetMin = Math.min(targetMin, boundedTargetMax);
  const boundedMaxSolutions = Math.min(Math.max(1, maxSolutions), MAX_VALID_SOLUTIONS);
  let bestLevel = null;

  for (let attempt = 0; attempt < maxLevelAttempts; attempt++) {
    const targetSum = randBetween(rand, boundedTargetMin, boundedTargetMax);
    const regions = generateRandomPartition(rand, {
      targetSum,
      maxCellValue,
      maxRegionSize,
      maxPartitionAttempts,
      maxRegionGrowthAttempts,
    });
    if (!regions) continue;

    const grid = buildGridFromPartition(rand, regions, targetSum, maxCellValue);
    if (!grid) continue;

    const validSolutionBorders = collectRegionCutSolutions(
      grid,
      targetSum,
      boundedMaxSolutions + 1,
    );
    if (validSolutionBorders.length === 0 || validSolutionBorders.length > boundedMaxSolutions) {
      continue;
    }

    const level = {
      title: title ?? buildTitle(rand),
      hint: hint ?? buildHint(targetSum, validSolutionBorders.length),
      difficulty: classifyDifficulty({
        targetSum,
        solutionCount: validSolutionBorders.length,
        regionCount: regions.length,
      }),
      targetSum,
      grid,
      solutionBorders: validSolutionBorders[0],
      validSolutionBorders,
    };

    if (preferUnique && validSolutionBorders.length === 1) return level;
    if (!bestLevel || validSolutionBorders.length < bestLevel.validSolutionBorders.length) {
      bestLevel = level;
    }
  }

  return bestLevel;
}

function buildSeedInput(date, salt) {
  return salt === 0 ? date : `${date}:${salt}`;
}

export function generateRegionCutLevelForDate(
  date,
  { seedAttempts = 12, ...generatorOptions } = {},
) {
  const iso = parseISODate(date);
  let bestLevel = null;

  for (let salt = 0; salt < seedAttempts; salt++) {
    const rand = mulberry32(fnv1a32(buildSeedInput(iso, salt)));
    const level = generateRegionCutLevel(rand, {
      date: iso,
      ...generatorOptions,
    });

    if (!level) continue;
    if (level.validSolutionBorders.length === 1) return level;
    if (!bestLevel || level.validSolutionBorders.length < bestLevel.validSolutionBorders.length) {
      bestLevel = level;
    }
  }

  return bestLevel;
}

export function writeRegionCutLevelFile(levelDir, date, level) {
  const file = path.join(levelDir, `${parseISODate(date)}.json`);
  fs.writeFileSync(file, JSON.stringify(level, null, 2) + "\n");
  return file;
}

export function generateNextRegionCutLevelFiles({
  count = 10,
  start = "tomorrow",
  levelDir = fileURLToPath(new URL(".", import.meta.url)),
  generatorOptions = {},
} = {}) {
  const resolvedDir = path.resolve(levelDir);
  const startDate =
    typeof start === "string" && start !== "today" && start !== "tomorrow"
      ? new Date(`${parseISODate(start)}T00:00:00`)
      : new Date();
  const baseDate = start === "tomorrow" ? addLocalDays(startDate, 1) : startDate;
  const createdFiles = [];
  const skippedFiles = [];

  for (let offset = 0; offset < count; offset++) {
    const date = formatLocalISODate(addLocalDays(baseDate, offset));
    const outPath = path.join(resolvedDir, `${date}.json`);
    if (fs.existsSync(outPath)) {
      skippedFiles.push(outPath);
      continue;
    }

    const level = generateRegionCutLevelForDate(date, generatorOptions);

    if (!level) {
      throw new Error(`Failed to generate Region Cut level for ${date}`);
    }

    fs.writeFileSync(outPath, JSON.stringify(level, null, 2) + "\n");
    createdFiles.push(outPath);
  }

  return { createdFiles, skippedFiles };
}

function parseBoolean(value, fallback) {
  if (value == null) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Expected boolean value "true" or "false", received: ${value}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    return args[index + 1] ?? null;
  };

  const count = Number(getArg("--next") ?? 10);
  const start = getArg("--start") ?? "tomorrow";
  const targetMin = Number(getArg("--target-min") ?? 8);
  const targetMax = Number(getArg("--target-max") ?? MAX_TARGET_SUM);
  const maxCellValue = Number(getArg("--max-cell") ?? DEFAULT_MAX_CELL_VALUE);
  const maxSolutions = Number(getArg("--max-solutions") ?? MAX_VALID_SOLUTIONS);
  const preferUnique = parseBoolean(getArg("--prefer-unique"), true);
  const maxLevelAttempts = Number(getArg("--attempts") ?? 800);

  const { createdFiles, skippedFiles } = generateNextRegionCutLevelFiles({
    count,
    start,
    generatorOptions: {
      targetMin,
      targetMax,
      maxCellValue,
      maxSolutions,
      preferUnique,
      maxLevelAttempts,
    },
  });

  process.stdout.write(
    JSON.stringify(
      {
        created: createdFiles.length,
        skipped: skippedFiles.length,
        createdFiles,
        skippedFiles,
      },
      null,
      2,
    ) + "\n",
  );
}

export { compareBorderSetsAgainstSolutions };
