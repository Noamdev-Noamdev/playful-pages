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
