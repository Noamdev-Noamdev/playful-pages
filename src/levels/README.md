# Daily Levels

Each original game can have a **new puzzle every day**, served from a JSON
archive in this folder. Adding a level = dropping a JSON file. No code edits,
no registry updates.

## Folder rule

```
src/levels/<game-slug>/<YYYY-MM-DD>.json
```

- `<game-slug>` is a freely chosen name your game asks for via `getDailyLevel("<slug>")`.
  It does **not** have to match the game's route slug — keep it human-readable
  (e.g. `rank-anything`).
- Filename **must** be `YYYY-MM-DD.json`. That's the day the level goes live.
- The JSON shape is whatever your game expects — each game owns its schema.

## Workflow to ship a new daily

1. Create `src/levels/rank-anything/2026-06-01.json`
2. Paste the puzzle data (same shape as one entry in the game's puzzle pool)
3. Save. Done — it goes live on June 1st automatically.

## Selection logic

`getDailyLevel(slug)` returns:
- the **latest** entry whose date is `≤ today`, OR
- if the archive is entirely in the future, a deterministic pick by date hash
  (so the game still works while you backfill), OR
- `null` if no folder exists for that slug (the game can fall back to its
  built-in random pool).

## Wiring a game

Inside any game component:

```tsx
import { getDailyLevel } from "@/levels";
import { DailyBadge } from "@/components/DailyBadge";
import type { Puzzle } from "./types";

const daily = getDailyLevel<Puzzle>("rank-anything");
const initialPuzzle = daily?.data ?? getRandomPuzzle();

// ...in JSX:
{daily && <DailyBadge dayNumber={daily.dayNumber} date={daily.date} />}
```

That's the entire integration.

## Testing a future puzzle

```ts
getDailyLevel("rank-anything", new Date("2026-12-25"))
```

## Helpers

- `getDailyLevel<T>(slug, today?)` — today's level
- `getLevelByDate<T>(slug, "YYYY-MM-DD")` — a specific day
- `getArchiveSize(slug)` — total authored levels
- `formatDate(date)` — local-time `YYYY-MM-DD` string
