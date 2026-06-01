import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  buildProfileFromReferenceLevels,
  countSolutions,
  extractDifficultyMetrics,
  generateSignalLevel,
  mulberry32,
} from "./generator.mjs";

const level29 = JSON.parse(
  fs.readFileSync(new URL("./2026-05-29.json", import.meta.url), "utf8"),
).grid;

const level31 = JSON.parse(
  fs.readFileSync(new URL("./2026-05-31.json", import.meta.url), "utf8"),
).grid;

test("signal generator produces 10 consecutive unique levels within reference profile", () => {
  const profile = buildProfileFromReferenceLevels([level29, level31]);

  for (let i = 0; i < 10; i++) {
    const rand = mulberry32(0xc0ffee + i);
    const date = `2026-07-${String(i + 1).padStart(2, "0")}`;
    const level = generateSignalLevel(rand, {
      date,
      title: "Generated",
      hint: "Generated",
      profile,
    });

    assert.ok(level, "expected a generated level");
    assert.equal(level.id, `signal-${date}`);
    assert.ok(Array.isArray(level.grid));
    assert.equal(level.grid.length, 6);
    for (const row of level.grid) assert.equal(row.length, 6);

    assert.equal(countSolutions(level.grid, 2), 1, "expected exactly one solution");

    const m = extractDifficultyMetrics(level.grid);
    assert.ok(m, "expected metrics");

    assert.ok(
      m.blockers >= profile.range.blockers.min && m.blockers <= profile.range.blockers.max,
      `blockers out of range: ${m.blockers}`,
    );
    assert.ok(
      m.constraints >= profile.range.constraints.min &&
        m.constraints <= profile.range.constraints.max,
      `constraints out of range: ${m.constraints}`,
    );
    assert.ok(
      m.towers >= profile.range.towers.min && m.towers <= profile.range.towers.max,
      `towers out of range: ${m.towers}`,
    );
    assert.ok(
      m.score >= profile.range.score.min && m.score <= profile.range.score.max,
      `score out of range: ${m.score}`,
    );
    assert.ok(
      m.decisions >= profile.range.decisions.min && m.decisions <= profile.range.decisions.max,
      `decisions out of range: ${m.decisions}`,
    );
  }
});
