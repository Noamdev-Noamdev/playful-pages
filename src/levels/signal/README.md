# Signal — Daily Levels

Drop one JSON file per day into this folder. Filename **must** be the date the puzzle should go live, formatted `YYYY-MM-DD.json` (local time).

```
src/levels/signal/2026-06-01.json
src/levels/signal/2026-06-02.json
```

Auto-loaded by `src/levels/index.ts` (Vite glob). No registry edit needed.

## Schema

```jsonc
{
  "id": "signal-2026-06-01", // any unique string
  "title": "Introduction", // short title shown above the board
  "hint": "Each number is the exact signal count that cell must receive.",
  "grid": [
    [".", ".", "2", ".", ".", "."],
    [".", ".", ".", ".", "2", "1"],
    [".", ".", ".", ".", ".", "."],
    [".", ".", ".", ".", ".", "."],
    ["1", ".", "2", ".", ".", "."],
    [".", ".", ".", ".", "1", "."],
  ],
}
```

## Grid cell tokens

Each row is an array of **6 string tokens** (grid is always 6×6):

| Token        | Meaning                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| `"."`        | Empty cell — you can place a tower here.                                          |
| `"#"`        | Blocked cell — signals stop here, no tower can be placed.                         |
| `"0"`..`"9"` | Constraint cell — must receive **exactly** this many signals. Beams pass through. |

## Rules

- **Grid is exactly 6 rows × 6 columns.** No exceptions.
- A tower emits in 4 cardinal directions; beams travel until they hit a blocked tile or the grid edge.
- Constraint tiles do NOT block beams — they only check the count of beams passing through.
- Always test that your puzzle has a unique, satisfiable solution before publishing.

## One puzzle per day

The game auto-loads the JSON dated today. Once solved, the daily is locked until midnight. Past days can be replayed from the archive (`/archive/signal`).

If no JSON exists for today, the game falls back to a deterministic pick from existing dated levels so the daily lock still works.

## Archive

Every authored date automatically appears in `/archive/signal` and can be replayed individually.

## Level generator (unique-solution)

This folder also contains a small generator that can create new Signal level JSON files which match the difficulty “profile” of reference levels and guarantees **exactly one** solution.

**How to use**

Generate JSON files for the next 10 days (starting tomorrow, local time):

```bash
cd playful-pages
node src/levels/signal/generator.mjs --next 10 --start tomorrow
```

Generate JSON files for the next 10 days starting today:

```bash
cd playful-pages
node src/levels/signal/generator.mjs --next 10 --start today
```

Generate JSON files for the next 10 days starting from a specific date:

```bash
cd playful-pages
node src/levels/signal/generator.mjs --next 10 --start 2026-06-01
```

Notes:

- The generator writes files into `src/levels/signal/` using the `YYYY-MM-DD.json` filename convention.
- Existing files are never overwritten; they are skipped.

**Core idea**

- A level is a 6×6 token grid. Towers can be placed on `"."` cells only.
- Each constraint digit (`"0"`..`"9"`) is the exact number of tower beams that must pass through that cell.
- The generator works “solution-first”: it randomly places blockers, chooses a hidden tower layout, computes the implied constraint numbers, then selects a subset of those numbers as clues until the puzzle has **exactly one** solution.

**Difficulty parameters extracted from references**

- `blockers`: how many `"#"` tiles exist.
- `constraints`: how many numeric clue tiles exist.
- `towers`: how many towers the unique solution contains.
- `decisions`: how many branching decisions the solver had to make before reaching the unique solution (higher generally means harder).
- `score`: a simple combined heuristic computed from the above to keep generated levels within the same “band” as the references.

**Validation routine**

- Every candidate grid is checked with a solver that counts solutions up to 2.
- If it finds multiple solutions, the generator automatically adds more constraint tiles (more clues).
- If it becomes unsatisfiable or can’t reach uniqueness within the allowed clue budget, it restarts with a new random layout.

**Tests**

- `npm run test` generates 10 levels in-memory and asserts:
  - JSON schema shape is correct (6×6 grid)
  - exactly 1 solution exists
  - generated difficulty metrics remain inside the reference ranges
