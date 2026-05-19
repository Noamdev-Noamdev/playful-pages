# Daily Levels System

Goal: every original game gets a **new level every day**, sourced from a JSON archive on disk. Adding a level = dropping a new JSON file into a folder. No code changes needed.

This mirrors how Inkwell Games does it: each puzzle is a small data file, and the site picks "today's" file based on the current date.

---

## Folder layout

```text
src/
  levels/
    index.ts                  ← generic loader + date helpers
    types.ts                  ← shared LevelMeta type
    rank-anything/            ← one folder per game (matches the game slug)
      2026-05-19.json
      2026-05-20.json
      2026-05-21.json
    alchemy/
      2026-05-19.json
      ...
    scale/
      2026-05-19.json
```

Rules:
- Folder name = game `slug` (e.g. `blank-1` or, better, a renamed slug like `rank-anything`).
- Filename = `YYYY-MM-DD.json`. That date is when the level goes live.
- The JSON shape is **per-game** (Rank Anything has items+values, Alchemy has a target chain, etc.) — each game owns its own schema.

---

## How the loader works (one file, all games)

`src/levels/index.ts` uses Vite's `import.meta.glob` to eagerly import every JSON under `src/levels/<slug>/*.json` at build time. No manual registry, no per-file imports.

```ts
// src/levels/index.ts
const modules = import.meta.glob("./*/*.json", { eager: true, import: "default" });

// Build: { "rank-anything": [{date, data}, ...], "alchemy": [...] }
// sorted by date ascending.

export function getDailyLevel<T = unknown>(slug: string, today = new Date()): {
  date: string;        // YYYY-MM-DD actually used
  dayNumber: number;   // 1-indexed position in the archive
  data: T;
} | null
```

Selection logic:
1. Look up the archive for `slug`.
2. Pick the **latest level whose date ≤ today**. That's "today's puzzle".
3. If no dated level is ≤ today (archive starts in the future or empty), fall back to a deterministic pick: `archive[hash(today) % archive.length]` so the game still works.
4. Return `null` if the folder doesn't exist — game can fall back to its built-in random pool.

Bonus helper: `getLevelByDate(slug, "2026-05-19")` for an archive/calendar view later.

---

## Per-game integration (tiny change)

Each game decides its own JSON shape and reads it via the loader. Example for Rank Anything — the `puzzles.ts` pool stays as a fallback, but on mount we try the daily level first:

```ts
// src/games/blank-1/RankGame.tsx
import { getDailyLevel } from "@/levels";
import type { Puzzle } from "./types";

const daily = getDailyLevel<Puzzle>("rank-anything");
const initialPuzzle = daily?.data ?? getRandomPuzzle();
```

The JSON file is literally the same shape as one entry in `puzzles.ts`:

```json
// src/levels/rank-anything/2026-05-19.json
{
  "id": 20260519,
  "prompt": "Rank from coldest to hottest",
  "promptEmoji": "🌡️",
  "shareLabel": "by temperature",
  "metric": "Average temperature (°C)",
  "difficulty": "medium",
  "items": [
    { "name": "Antarctica", "emoji": "🧊", "value": -60, "fact": "−60 °C" },
    ...
  ]
}
```

Other games do the same with their own schema (Alchemy → target chain JSON, Scale → comparison JSON, etc.).

---

## "Today" + share text

- Show today's date and a day counter in each game header: `"Daily #42 · May 19"` — comes from `dayNumber` and `date` returned by the loader.
- The share text already exists in Rank Anything; we append `Daily #42` so results are comparable between players who all played the same puzzle.
- Date is computed in the user's local timezone (`new Date()`), which matches what Inkwell does. Easy to switch to UTC later if needed.

---

## Adding a new daily level (the whole workflow)

1. Create `src/levels/<game-slug>/<YYYY-MM-DD>.json`.
2. Paste the puzzle data.
3. Save. Done — it auto-appears on that date.

No code edits, no registry updates, no rebuild config.

---

## Technical notes

- `import.meta.glob("./*/*.json", { eager: true })` bundles every JSON at build time. Switch to `{ eager: false }` + dynamic import later if the archive gets huge.
- Date parsing: filenames are parsed with a strict `YYYY-MM-DD` regex. Bad filenames are skipped with a `console.warn` so a typo doesn't crash the build.
- Type safety: `getDailyLevel<T>` is generic; each game passes its own type. Optionally, we add a Zod schema per game and validate the JSON on load so a malformed file fails loudly.
- Caching: results are memoized per `(slug, dateKey)` so re-renders don't re-scan.
- Fallback to the existing `puzzles.ts` pool means partial migration is fine — you can seed only some days and the game stays playable.
- Testing a future puzzle: pass an explicit date to `getDailyLevel(slug, new Date("2026-06-01"))` (we'll expose a tiny `?date=` query-param hook in dev only).
- This is purely client-side and static — no backend, no Lovable Cloud needed.

---

## What gets built

1. `src/levels/index.ts` — loader, date helpers, `getDailyLevel`, `getLevelByDate`.
2. `src/levels/types.ts` — `LevelEntry<T>` shared type.
3. `src/levels/README.md` — one-page guide: "drop a JSON named YYYY-MM-DD.json into `src/levels/<slug>/`".
4. Seed one example file per existing original (so the system is visibly working): `src/levels/rank-anything/<today>.json` etc.
5. Update `src/games/blank-1/RankGame.tsx` (and similar tiny touches for the other 2 built originals) to prefer the daily level when present.
6. Header badge component `DailyBadge` showing `Daily #N · <date>` — drop-in for any game.

After this, the only thing you do day-to-day is **add JSON files**.
