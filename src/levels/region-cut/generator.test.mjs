import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compareBorderSetsAgainstSolutions,
  generateNextRegionCutLevelFiles,
  generateRegionCutLevel,
  generateRegionCutLevelForDate,
  mulberry32,
  validateRegionCutLevel,
} from "./generator.mjs";

test("region-cut generator respects max target sum and max 3 stored solutions", () => {
  for (let i = 0; i < 3; i++) {
    const rand = mulberry32(0xc0ffee + i);
    const level = generateRegionCutLevel(rand, {
      date: `2026-07-${String(i + 1).padStart(2, "0")}`,
      maxLevelAttempts: 800,
    });

    assert.ok(level, "expected a generated level");
    const validation = validateRegionCutLevel(level);

    assert.equal(validation.targetWithinLimit, true, "target sum exceeded the cap of 12");
    assert.equal(validation.gridWithinLimit, true, "grid contained a value above 12");
    assert.equal(
      validation.solutionCountWithinLimit,
      true,
      "generator produced more than 3 valid solutions",
    );
    assert.equal(
      validation.storedSolutionsMatch,
      true,
      "stored solutions did not match solver output",
    );
    assert.ok(level.validSolutionBorders.length >= 1, "expected at least one stored solution");
    assert.ok(
      level.validSolutionBorders.length <= 3,
      "expected no more than three stored solutions",
    );
    assert.equal(
      level.solutionBorders.join("|"),
      level.validSolutionBorders[0].join("|"),
      "canonical solution should match the first stored solution",
    );
  }
});

test("multi-solution checking accepts any exact solution and compatible partial progress", () => {
  const solutions = [
    ["0,0-0,1", "1,0-1,1"],
    ["0,1-0,2", "1,1-1,2", "2,1-2,2"],
  ];

  const exactFirst = compareBorderSetsAgainstSolutions(new Set(solutions[0]), solutions);
  const exactSecond = compareBorderSetsAgainstSolutions(new Set(solutions[1]), solutions);
  const partialSecond = compareBorderSetsAgainstSolutions(new Set(["0,1-0,2"]), solutions);
  const wrong = compareBorderSetsAgainstSolutions(new Set(["9,9-9,10"]), solutions);

  assert.equal(exactFirst.exact, true);
  assert.equal(exactFirst.compatible, true);
  assert.equal(exactSecond.exact, true);
  assert.equal(exactSecond.compatible, true);
  assert.equal(partialSecond.exact, false);
  assert.equal(partialSecond.compatible, true);
  assert.equal(wrong.compatible, false);
});

test("region-cut generator writes dated files and keeps existing ones untouched", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "region-cut-generator-"));
  const existingPath = path.join(tmpDir, "2026-08-01.json");
  fs.writeFileSync(existingPath, '{"title":"existing"}\n');

  const result = generateNextRegionCutLevelFiles({
    count: 2,
    start: "2026-08-01",
    levelDir: tmpDir,
    generatorOptions: { maxLevelAttempts: 800 },
  });

  assert.equal(result.skippedFiles.length, 1, "expected the existing file to be skipped");
  assert.equal(result.createdFiles.length, 1, "expected one new file to be generated");
  assert.equal(fs.readFileSync(existingPath, "utf8"), '{"title":"existing"}\n');

  const createdLevel = JSON.parse(fs.readFileSync(result.createdFiles[0], "utf8"));
  const validation = validateRegionCutLevel(createdLevel);
  assert.equal(validation.solutionCountWithinLimit, true);
  assert.equal(validation.targetWithinLimit, true);
});

test("region-cut date-based generator retries alternate deterministic seeds", () => {
  const level = generateRegionCutLevelForDate("2026-06-21", {
    maxLevelAttempts: 800,
  });

  assert.ok(level, "expected the date-based generator to recover with a fallback seed");
  const validation = validateRegionCutLevel(level);
  assert.equal(validation.solutionCountWithinLimit, true);
  assert.equal(validation.targetWithinLimit, true);
  assert.equal(validation.storedSolutionsMatch, true);
});

test("region-cut README documents setup, running, parameters, and troubleshooting", () => {
  const readme = fs.readFileSync(new URL("./README.md", import.meta.url), "utf8");

  assert.match(readme, /## Installation/i);
  assert.match(readme, /## Run/i);
  assert.match(readme, /## Parameters/i);
  assert.match(readme, /## Troubleshooting/i);
  assert.match(readme, /validSolutionBorders/i);
  assert.match(readme, /max 3 valid solutions/i);
});
