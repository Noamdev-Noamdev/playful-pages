import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GS = 6;

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

function randInt(rand, n) {
  return Math.floor(rand() * n);
}

function shuffle(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rand, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inBounds(r, c) {
  return r >= 0 && r < GS && c >= 0 && c < GS;
}

export function countConstraints(tokenGrid) {
  return tokenGrid.flat().filter((t) => t !== "." && t !== "#").length;
}

export function countBlockers(tokenGrid) {
  return tokenGrid.flat().filter((t) => t === "#").length;
}

export function countVars(tokenGrid) {
  return tokenGrid.flat().filter((t) => t === ".").length;
}

function buildConstraintSystem(tokenGrid) {
  const constraints = [];
  const constraintIndexByCell = Array.from({ length: GS }, () => Array(GS).fill(-1));

  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      const t = tokenGrid[r][c];
      if (t === "." || t === "#") continue;
      const req = Number(t);
      if (!Number.isFinite(req)) continue;
      constraintIndexByCell[r][c] = constraints.length;
      constraints.push({ r, c, req, vars: [] });
    }
  }

  const vars = [];
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      if (tokenGrid[r][c] !== ".") continue;
      vars.push({ r, c });
    }
  }

  const varToConstraints = Array.from({ length: vars.length }, () => []);
  for (let vi = 0; vi < vars.length; vi++) {
    const { r, c } = vars[vi];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        if (tokenGrid[nr][nc] === "#") break;
        const ci = constraintIndexByCell[nr][nc];
        if (ci !== -1) varToConstraints[vi].push(ci);
        nr += dr;
        nc += dc;
      }
    }
  }

  for (let vi = 0; vi < vars.length; vi++) {
    for (const ci of varToConstraints[vi]) constraints[ci].vars.push(vi);
  }

  return { constraints, vars, varToConstraints };
}

export function countSolutions(tokenGrid, limit = 2) {
  const { constraints, vars, varToConstraints } = buildConstraintSystem(tokenGrid);

  const assign = new Int8Array(vars.length).fill(-1);
  const sum = new Int16Array(constraints.length);
  const unk = new Int16Array(constraints.length);
  for (let ci = 0; ci < constraints.length; ci++) {
    sum[ci] = 0;
    unk[ci] = constraints[ci].vars.length;
  }

  const feasible = (ci) => {
    const req = constraints[ci].req;
    const s = sum[ci];
    const u = unk[ci];
    return s <= req && req <= s + u;
  };

  const setVar = (vi, val, stack) => {
    const cur = assign[vi];
    if (cur !== -1) return cur === val;
    assign[vi] = val;
    stack.push(vi);
    for (const ci of varToConstraints[vi]) {
      unk[ci]--;
      if (val === 1) sum[ci]++;
      if (!feasible(ci)) return false;
    }
    return true;
  };

  const rollback = (stack) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const vi = stack[i];
      const val = assign[vi];
      assign[vi] = -1;
      for (const ci of varToConstraints[vi]) {
        unk[ci]++;
        if (val === 1) sum[ci]--;
      }
    }
  };

  const propagate = (stack) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (let ci = 0; ci < constraints.length; ci++) {
        const req = constraints[ci].req;
        const s = sum[ci];
        const u = unk[ci];
        if (u === 0) continue;
        if (req === s) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 0, stack)) return false;
              changed = true;
            }
          }
        } else if (req === s + u) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 1, stack)) return false;
              changed = true;
            }
          }
        }
      }
    }
    return true;
  };

  const allSatisfied = () => {
    for (let ci = 0; ci < constraints.length; ci++) {
      if (sum[ci] !== constraints[ci].req) return false;
    }
    return true;
  };

  const pickVar = () => {
    let best = -1;
    let bestDeg = -1;
    for (let vi = 0; vi < vars.length; vi++) {
      if (assign[vi] !== -1) continue;
      const deg = varToConstraints[vi].length;
      if (deg > bestDeg) {
        bestDeg = deg;
        best = vi;
      }
    }
    return best;
  };

  for (let ci = 0; ci < constraints.length; ci++) {
    if (!feasible(ci)) return 0;
  }

  let solutions = 0;

  const dfs = () => {
    if (solutions >= limit) return;

    const stack = [];
    if (!propagate(stack)) {
      rollback(stack);
      return;
    }

    if (allSatisfied()) {
      for (let vi = 0; vi < vars.length; vi++) {
        if (assign[vi] === -1) {
          solutions = limit;
          rollback(stack);
          return;
        }
      }
      solutions++;
      rollback(stack);
      return;
    }

    const vi = pickVar();
    if (vi === -1) {
      rollback(stack);
      return;
    }

    {
      const s2 = [];
      if (setVar(vi, 1, s2)) dfs();
      rollback(s2);
    }
    {
      const s2 = [];
      if (setVar(vi, 0, s2)) dfs();
      rollback(s2);
    }

    rollback(stack);
  };

  dfs();
  return Math.min(solutions, limit);
}

export function solveUniqueWithStats(tokenGrid) {
  const { constraints, vars, varToConstraints } = buildConstraintSystem(tokenGrid);

  const assign = new Int8Array(vars.length).fill(-1);
  const sum = new Int16Array(constraints.length);
  const unk = new Int16Array(constraints.length);
  for (let ci = 0; ci < constraints.length; ci++) {
    sum[ci] = 0;
    unk[ci] = constraints[ci].vars.length;
  }

  const stats = {
    decisions: 0,
    propagations: 0,
    setOps: 0,
  };

  const feasible = (ci) => {
    const req = constraints[ci].req;
    const s = sum[ci];
    const u = unk[ci];
    return s <= req && req <= s + u;
  };

  const setVar = (vi, val, stack) => {
    const cur = assign[vi];
    if (cur !== -1) return cur === val;
    assign[vi] = val;
    stats.setOps++;
    stack.push(vi);
    for (const ci of varToConstraints[vi]) {
      unk[ci]--;
      if (val === 1) sum[ci]++;
      if (!feasible(ci)) return false;
    }
    return true;
  };

  const rollback = (stack) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const vi = stack[i];
      const val = assign[vi];
      assign[vi] = -1;
      for (const ci of varToConstraints[vi]) {
        unk[ci]++;
        if (val === 1) sum[ci]--;
      }
    }
  };

  const propagate = (stack) => {
    stats.propagations++;
    let changed = true;
    while (changed) {
      changed = false;
      for (let ci = 0; ci < constraints.length; ci++) {
        const req = constraints[ci].req;
        const s = sum[ci];
        const u = unk[ci];
        if (u === 0) continue;
        if (req === s) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 0, stack)) return false;
              changed = true;
            }
          }
        } else if (req === s + u) {
          for (const vi of constraints[ci].vars) {
            if (assign[vi] === -1) {
              if (!setVar(vi, 1, stack)) return false;
              changed = true;
            }
          }
        }
      }
    }
    return true;
  };

  const allSatisfied = () => {
    for (let ci = 0; ci < constraints.length; ci++) {
      if (sum[ci] !== constraints[ci].req) return false;
    }
    return true;
  };

  const pickVar = () => {
    let best = -1;
    let bestDeg = -1;
    for (let vi = 0; vi < vars.length; vi++) {
      if (assign[vi] !== -1) continue;
      const deg = varToConstraints[vi].length;
      if (deg > bestDeg) {
        bestDeg = deg;
        best = vi;
      }
    }
    return best;
  };

  for (let ci = 0; ci < constraints.length; ci++) {
    if (!feasible(ci)) return null;
  }

  let solution = null;
  let solutions = 0;

  const dfs = () => {
    if (solutions >= 2) return;

    const stack = [];
    if (!propagate(stack)) {
      rollback(stack);
      return;
    }

    if (allSatisfied()) {
      for (let vi = 0; vi < vars.length; vi++) {
        if (assign[vi] === -1) {
          rollback(stack);
          return;
        }
      }
      solutions++;
      if (solutions === 1) solution = new Int8Array(assign);
      rollback(stack);
      return;
    }

    const vi = pickVar();
    if (vi === -1) {
      rollback(stack);
      return;
    }

    stats.decisions++;
    {
      const s2 = [];
      if (setVar(vi, 1, s2)) dfs();
      rollback(s2);
    }
    {
      const s2 = [];
      if (setVar(vi, 0, s2)) dfs();
      rollback(s2);
    }

    rollback(stack);
  };

  dfs();
  if (!solution || solutions !== 1) return null;

  const towers = Array.from({ length: GS }, () => Array(GS).fill(false));
  for (let vi = 0; vi < vars.length; vi++) {
    if (solution[vi] === 1) {
      const { r, c } = vars[vi];
      towers[r][c] = true;
    }
  }

  return { towers, stats };
}

export function countTowersFromSolution(tokenGrid) {
  const solved = solveUniqueWithStats(tokenGrid);
  if (!solved) return null;
  let n = 0;
  for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) if (solved.towers[r][c]) n++;
  return n;
}

export function difficultyScore(tokenGrid) {
  const towers = countTowersFromSolution(tokenGrid);
  if (towers == null) return null;
  return (
    countVars(tokenGrid) + 3 * towers + 2 * countBlockers(tokenGrid) - countConstraints(tokenGrid)
  );
}

export function extractDifficultyMetrics(tokenGrid) {
  const solved = solveUniqueWithStats(tokenGrid);
  if (!solved) return null;
  const towers = solved.towers;
  let towerCount = 0;
  for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) if (towers[r][c]) towerCount++;

  return {
    blockers: countBlockers(tokenGrid),
    constraints: countConstraints(tokenGrid),
    vars: countVars(tokenGrid),
    towers: towerCount,
    score: difficultyScore(tokenGrid),
    decisions: solved.stats.decisions,
    propagations: solved.stats.propagations,
    setOps: solved.stats.setOps,
  };
}

export function buildProfileFromReferenceLevels(referenceTokenGrids) {
  const metrics = referenceTokenGrids.map(extractDifficultyMetrics);
  if (metrics.some((m) => m == null)) {
    throw new Error("At least one reference level is not uniquely solvable.");
  }

  const keys = Object.keys(metrics[0]);
  const range = {};
  for (const k of keys) {
    const vals = metrics.map((m) => m[k]).filter((v) => typeof v === "number");
    range[k] = { min: Math.min(...vals), max: Math.max(...vals) };
  }

  return { references: metrics, range };
}

function computeCoverage(baseGrid, towers) {
  const cov = Array.from({ length: GS }, () => Array(GS).fill(0));
  for (let r = 0; r < GS; r++) {
    for (let c = 0; c < GS; c++) {
      if (!towers[r][c]) continue;
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          if (baseGrid[nr][nc] === "#") break;
          cov[nr][nc]++;
          nr += dr;
          nc += dc;
        }
      }
    }
  }
  return cov;
}

function makeEmptyGrid() {
  return Array.from({ length: GS }, () => Array(GS).fill("."));
}

function gridWithConstraints(baseGrid, constraints) {
  const g = baseGrid.map((row) => [...row]);
  for (const { r, c, v } of constraints) g[r][c] = String(v);
  return g;
}

export function generateSignalTokenGrid(rand, profile, opts = {}) {
  const { maxAttempts = 20000, softMaxConstraintsPadding = 2, maxConstraintValue = 9 } = opts;

  const { min: minBlockers, max: maxBlockers } = profile.range.blockers;
  const { min: minConstraints, max: maxConstraints } = profile.range.constraints;
  const { min: minTowers, max: maxTowers } = profile.range.towers;
  const { min: minScore, max: maxScore } = profile.range.score;
  const { min: minDecisions, max: maxDecisions } = profile.range.decisions;

  const targetBlockers =
    minBlockers === maxBlockers
      ? minBlockers
      : minBlockers + randInt(rand, maxBlockers - minBlockers + 1);
  const targetTowers =
    minTowers === maxTowers ? minTowers : minTowers + randInt(rand, maxTowers - minTowers + 1);

  const allCells = [];
  for (let r = 0; r < GS; r++) for (let c = 0; c < GS; c++) allCells.push([r, c]);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const baseGrid = makeEmptyGrid();
    for (const [r, c] of shuffle(rand, allCells).slice(0, targetBlockers)) baseGrid[r][c] = "#";

    const empties = [];
    for (let r = 0; r < GS; r++)
      for (let c = 0; c < GS; c++) if (baseGrid[r][c] === ".") empties.push([r, c]);
    if (empties.length < targetTowers + 6) continue;

    const towers = Array.from({ length: GS }, () => Array(GS).fill(false));
    for (const [r, c] of shuffle(rand, empties).slice(0, targetTowers)) towers[r][c] = true;

    const cov = computeCoverage(baseGrid, towers);

    const candidates = [];
    for (let r = 0; r < GS; r++) {
      for (let c = 0; c < GS; c++) {
        if (baseGrid[r][c] === "#") continue;
        if (towers[r][c]) continue;
        const v = cov[r][c];
        if (v < 0 || v > maxConstraintValue) continue;
        candidates.push({ r, c, v });
      }
    }

    const ordered = [
      ...shuffle(
        rand,
        candidates.filter((x) => x.v > 0),
      ),
      ...shuffle(
        rand,
        candidates.filter((x) => x.v === 0),
      ),
    ];

    const constraintTarget =
      minConstraints === maxConstraints
        ? minConstraints
        : minConstraints + randInt(rand, maxConstraints - minConstraints + 1);

    const selected = [];
    const used = new Set();
    const add = (obj) => {
      const k = `${obj.r},${obj.c}`;
      if (used.has(k)) return;
      used.add(k);
      selected.push(obj);
    };

    for (const obj of ordered.slice(0, Math.min(constraintTarget, ordered.length))) add(obj);

    const cap = Math.min(
      ordered.length,
      Math.max(constraintTarget, maxConstraints + softMaxConstraintsPadding),
    );

    for (let i = selected.length; i <= cap; i++) {
      const tokenGrid = gridWithConstraints(baseGrid, selected);
      const sols = countSolutions(tokenGrid, 2);
      if (sols === 1) {
        const m = extractDifficultyMetrics(tokenGrid);
        if (!m) break;
        if (m.blockers !== targetBlockers) break;
        if (m.towers !== targetTowers) break;
        if (m.constraints < minConstraints || m.constraints > maxConstraints) break;
        if (m.score == null || m.score < minScore || m.score > maxScore) break;
        if (m.decisions < minDecisions || m.decisions > maxDecisions) break;
        return tokenGrid;
      }
      if (sols === 0) break;
      if (i < ordered.length) add(ordered[i]);
    }
  }

  return null;
}

export function generateSignalLevel(rand, { date, title, hint, profile }) {
  const iso = parseISODate(date);
  const grid = generateSignalTokenGrid(rand, profile);
  if (!grid) return null;

  return {
    id: `signal-${iso}`,
    title,
    hint,
    grid,
  };
}

export function writeSignalLevelFile(levelDir, level) {
  const file = path.join(levelDir, `${parseISODate(level.id.replace(/^signal-/, ""))}.json`);
  fs.writeFileSync(file, JSON.stringify(level, null, 2) + "\n");
  return file;
}

export function formatLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addLocalDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function generateNextSignalLevelFiles({
  count = 10,
  start = "tomorrow",
  levelDir = fileURLToPath(new URL(".", import.meta.url)),
  referenceFiles = ["2026-05-29.json", "2026-05-31.json"],
  title = "Signal",
  hint = "Each number is the exact signal count that cell must receive.",
} = {}) {
  const resolvedDir = path.resolve(levelDir);
  const referenceTokenGrids = referenceFiles.map((f) => {
    const full = path.join(resolvedDir, f);
    const raw = JSON.parse(fs.readFileSync(full, "utf8"));
    return raw.grid;
  });

  const profile = buildProfileFromReferenceLevels(referenceTokenGrids);

  const startDate =
    typeof start === "string" && start !== "today" && start !== "tomorrow"
      ? new Date(`${parseISODate(start)}T00:00:00`)
      : new Date();

  const base =
    typeof start === "string" && start === "today" ? startDate : addLocalDays(startDate, 1);

  const createdFiles = [];
  const skippedFiles = [];

  for (let i = 0; i < count; i++) {
    const date = formatLocalISODate(addLocalDays(base, i));
    const outPath = path.join(resolvedDir, `${date}.json`);
    if (fs.existsSync(outPath)) {
      skippedFiles.push(outPath);
      continue;
    }

    const rand = mulberry32(fnv1a32(date));
    const level = generateSignalLevel(rand, { date, title, hint, profile });
    if (!level) {
      throw new Error(`Failed to generate level for ${date}`);
    }

    fs.writeFileSync(outPath, JSON.stringify(level, null, 2) + "\n");
    createdFiles.push(outPath);
  }

  return { createdFiles, skippedFiles };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(name);
    if (idx === -1) return null;
    return args[idx + 1] ?? null;
  };

  const nextRaw = getArg("--next");
  const startRaw = getArg("--start");

  const count = nextRaw ? Number(nextRaw) : 10;
  const start = startRaw ?? "tomorrow";

  const { createdFiles, skippedFiles } = generateNextSignalLevelFiles({
    count,
    start,
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
