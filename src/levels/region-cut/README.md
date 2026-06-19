# Region Cut — Daily Levels And Generator

Drop one JSON file per day into this folder. The filename must be the date the puzzle should go live, using `YYYY-MM-DD.json`.

```text
src/levels/region-cut/2026-06-17.json
src/levels/region-cut/2026-06-18.json
```

These files are auto-loaded by `src/levels/index.ts`, so no manual registry change is needed.

## Schema

```jsonc
{
  "title": "Balanced Cut",
  "hint": "Split the grid into connected regions that each sum to 10.",
  "difficulty": "medium",
  "targetSum": 10,
  "grid": [
    [1, 3, 2, 1, 2, 1],
    [2, 2, 1, 4, 1, 2],
    [3, 1, 2, 1, 3, 1],
    [1, 2, 3, 1, 2, 1],
    [2, 1, 1, 3, 2, 1],
    [1, 3, 2, 1, 1, 2],
  ],
  "solutionBorders": ["0,0-0,1", "1,0-1,1"],
  "validSolutionBorders": [
    ["0,0-0,1", "1,0-1,1"],
    ["0,1-0,2", "1,1-1,2"],
  ],
}
```

## Required Rules

- The board is always `6 x 6`.
- Every region must be orthogonally connected.
- Every valid region must sum to `targetSum`.
- Generated levels must never use a `targetSum` above `12`.
- Generated levels must never store more than `3` distinct valid solutions.
- `solutionBorders` is the canonical first solution for backwards compatibility.
- `validSolutionBorders` stores every accepted solution that the check button should recognize.

## Installation

The generator uses only the repo's existing Node setup.

1. Open a terminal in the project root:

```bash
cd /home/noam/Gamesite/playful-pages
```

2. Install dependencies if you have not already:

```bash
npm install
```

3. No extra package or global CLI is required. The generator runs directly with Node.

## Run

Generate the next 10 Region Cut levels starting tomorrow:

```bash
node src/levels/region-cut/generator.mjs --next 10 --start tomorrow
```

Generate 5 levels starting from an exact date:

```bash
node src/levels/region-cut/generator.mjs --next 5 --start 2026-07-01
```

Generate levels while tightening the target range:

```bash
node src/levels/region-cut/generator.mjs --next 7 --start today --target-min 8 --target-max 10
```

The generator never overwrites an existing dated JSON file. Existing files are skipped and reported in the CLI output.

## How It Works

The Region Cut generator is solution-first, similar in spirit to the Signal generator:

1. It chooses a target sum that is capped at `12`.
2. It builds a random connected partition of the `6 x 6` board.
3. It assigns cell values so each hidden region sums to the chosen target.
4. It runs a solver that enumerates all valid full-board region partitions.
5. It rejects the candidate unless the final solution count is between `1` and `3`.
6. It stores every accepted solution in `validSolutionBorders`.

The generator prefers unique puzzles when possible, but it can keep a 2- or 3-solution puzzle if it still respects the configured maximum.

## Parameters

The CLI supports these parameters:

- `--next <number>`: default `10`. Number of new dated files to create.
- `--start <value>`: default `tomorrow`. Accepts `today`, `tomorrow`, or `YYYY-MM-DD`.
- `--target-min <number>`: default `8`. Lowest target sum the generator may use.
- `--target-max <number>`: default `12`. Highest target sum the generator may use, still hard-capped to `12`.
- `--max-cell <number>`: default `4`. Largest value that can appear in an individual grid cell.
- `--max-solutions <number>`: default `3`. Maximum allowed number of valid solutions. This is a hard cap of max 3 valid solutions.
- `--prefer-unique <true|false>`: default `true`. If `true`, the generator keeps searching for a 1-solution puzzle before falling back to 2 or 3.
- `--attempts <number>`: default `800`. Maximum generation attempts per output file before the command fails.

## Step-By-Step Workflow

1. Run the generator command with your desired date range and parameters.
2. Confirm the command reports the created files.
3. Open the generated JSON and spot-check the title, hint, target, and stored `validSolutionBorders`.
4. Run the automated tests from the project root:

```bash
npm run test
```

5. Start the app and load the generated date from the archive or daily route if you want a visual QA pass.

## Troubleshooting

### The generator says it failed to create a level for a date

- Raise `--attempts` so it can search longer.
- Narrow the search space, for example `--target-min 8 --target-max 10`.
- Keep `--prefer-unique true` only if you truly want mostly unique levels; setting it to `false` can help generation finish faster.

### The generator keeps skipping dates

- A JSON file with that date already exists in this folder.
- Rename or remove the existing file if you want a fresh level for that date.

### I need to verify the stored solutions

- Run `npm run test`.
- The Region Cut test suite re-solves generated boards and confirms the stored `validSolutionBorders` exactly match the solver output.

### The check button does not behave as expected

- Make sure the level has `validSolutionBorders` populated.
- Older files without `validSolutionBorders` still work because the runtime falls back to the single `solutionBorders` array.

## Testing

The Region Cut generator test file lives beside the generator:

```text
src/levels/region-cut/generator.test.mjs
```

The test coverage verifies:

- generated levels stay within the max target sum of `12`
- generated levels never exceed the max of `3` valid solutions
- stored solutions match the solver output exactly
- multi-solution check semantics accept exact and partial matches correctly
- generated files integrate cleanly into the existing dated level folder structure
- this README includes setup, run, parameter, and troubleshooting guidance
