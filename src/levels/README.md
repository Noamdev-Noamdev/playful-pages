# Daily Levels

Every original game can ship a **new puzzle every day**. Levels are JSON
files on disk — no database, no backend, no rebuild config. To add a level
you drop a file into a folder. To play an old one, visit the **Archive**.

---

## 1. Folder rule

```
src/levels/<game-slug>/<YYYY-MM-DD>.json
```

- `<game-slug>` is whatever name the game passes to `getDailyLevel("<slug>")`.
  It does **not** have to match the route slug — keep it readable
  (e.g. `rank-anything`, not `blank-1`).
- Filename **must** be `YYYY-MM-DD.json`. That's the day the level goes live.
- The JSON shape is **whatever the game expects** — each game owns its own
  schema. The loader doesn't validate; the game does.

---

## 2. JSON structure

The file contains a single JSON object. The shape mirrors **one entry from
the game's built-in puzzle pool** (e.g. `src/games/blank-1/puzzles.ts`).

### Required at the loader level

Nothing — the loader returns the raw object as `level.data`. But each game
defines its own TypeScript type and the file must match it.

### Example: `rank-anything`

Matches `Puzzle` from `src/games/blank-1/types.ts`:

```json
{
  "id": 20260519,
  "prompt": "Rank from coldest to hottest",
  "promptEmoji": "🌡️",
  "shareLabel": "by temperature",
  "metric": "Average temperature (°C)",
  "difficulty": "medium",
  "items": [
    { "name": "Antarctica", "emoji": "🧊", "value": -60, "fact": "−60 °C avg" },
    { "name": "Siberia",    "emoji": "❄️", "value": -25, "fact": "−25 °C avg" },
    { "name": "London",     "emoji": "☁️", "value": 19,  "fact": "~19 °C avg" },
    { "name": "Sahara",     "emoji": "🏜️", "value": 38,  "fact": "~38 °C avg" },
    { "name": "Venus",      "emoji": "🪐", "value": 465, "fact": "465 °C" }
  ]
}
```

| Field         | Type   | What it is                                          |
| ------------- | ------ | --------------------------------------------------- |
| `id`          | number | Unique id — use `YYYYMMDD` for daily levels         |
| `prompt`      | string | Question shown above the cards                      |
| `promptEmoji` | string | Single emoji next to the prompt                     |
| `shareLabel`  | string | Short label used in share text                      |
| `metric`      | string | Subtitle telling the player what they're sorting by |
| `difficulty`  | enum   | `"easy" \| "medium" \| "hard"`                      |
| `items`       | array  | Exactly 5 items, each with name/emoji/value/fact    |

### For other games

Open the game's `types.ts` (e.g. `src/games/blank-2/types.ts`) and copy
the same shape. Whatever your game's `Puzzle` / `Level` interface looks
like — that's exactly what the JSON has to look like.

---

## 3. Workflow to ship a new daily

1. Create `src/levels/<game-slug>/<YYYY-MM-DD>.json`
2. Paste the puzzle data (same shape as an entry in the game's `puzzles.ts`)
3. Save. It goes live on that date — no code changes.

---

## 4. Selection logic (what `getDailyLevel` does)

For a given `slug` and `today`:

1. Returns the **latest** entry whose date is `≤ today`.
2. If the archive is entirely in the future, falls back to a deterministic
   pick by date hash so the game still works.
3. Returns `null` if no folder exists for that slug. The game can then fall
   back to its built-in random pool.

---

## 5. Archive — play old levels

Every game with `dailySlug` set in its `Game` config automatically shows up
in the **Archive** (top-right nav link, or visit `/archive`).

- `/archive` lists every game that has at least one authored level.
- `/archive/<game-slug>` lists every dated level for that game (newest first,
  with day number, "Today" badge, and "Upcoming" badge for future-dated files).
- Clicking a date opens `/play/<game-slug>?date=YYYY-MM-DD` — the game reads
  the `date` search param and loads that exact level via `getLevelByDate`.

To wire a new game into the archive:

```ts
// src/games/my-game.tsx
const MyGame: Game = {
  // ...
  dailySlug: "my-game",   // ← matches the folder name under src/levels/
};
```

Then inside the game component:

```ts
const dailyLevel = useMemo(() => {
  if (typeof window === "undefined") return getDailyLevel<Puzzle>("my-game");
  const date = new URLSearchParams(window.location.search).get("date");
  return date
    ? getLevelByDate<Puzzle>("my-game", date)
    : getDailyLevel<Puzzle>("my-game");
}, []);
```

That's the full integration. See `src/games/blank-1/RankGame.tsx` for a
working example.

---

## 6. Helpers (`@/levels`)

| Function                                  | Use for                                                    |
| ----------------------------------------- | ---------------------------------------------------------- |
| `getDailyLevel<T>(slug, today?)`          | Today's level for a game                                   |
| `getLevelByDate<T>(slug, "YYYY-MM-DD")`   | A specific dated level (archive playback)                  |
| `getArchiveDates(slug)`                   | `[{ date, dayNumber }, ...]` — every authored date         |
| `getArchiveSize(slug)`                    | Total authored levels                                      |
| `listArchiveSlugs()`                      | Every game slug that has at least one level                |
| `formatDate(date)`                        | Local-time `YYYY-MM-DD` string                             |

---

## 7. Testing a future puzzle

```ts
getDailyLevel("rank-anything", new Date("2026-12-25"))
```

Or just visit `/play/<game-slug>?date=2026-12-25` directly.
