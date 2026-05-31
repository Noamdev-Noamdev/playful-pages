## Goal

Apply the same daily/archive system used by Rank Anything and How Big Is It Really to Timeline Builder.

## Changes

### 1. `src/games/timeline-builder.tsx`

Add `dailySlug: "timeline-builder"` to the Game config so the `/play/$slug` route enforces the daily lock and the `/archive/$slug` route appears.

### 2. `src/games/timeline-builder/TimelineGame.tsx`

Mirror the structure from `how-big/ScaleGame.tsx`:

- Read `?date` search param via `useSearch({ from: "/play/$slug" })`.
- Build the active `Timeline` from:
  - If a JSON exists in `src/levels/timeline-builder/<date>.json` (or today's date), use `getLevelByDate` / `getDailyLevel` → that `Timeline`.
  - Otherwise fall back deterministically per day by seeding selection from the built-in `timelines` pool using `seedKey = (dateParam ?? todayKey)` (so the same timeline is served all day even without authored JSONs). Replace the current `getRandomTimeline()` call.
- Compute `isTodaysDaily = !dateParam` (i.e. playing today's puzzle, not an archive replay).
- On `phase === "revealed" && isTodaysDaily`, call `markDailyComplete("timeline-builder")` in a `useEffect`.
- Replace the existing "Next timeline →" button with conditional UI:
  - If `isTodaysDaily`: show "See you tomorrow! 👋" message (no replay).
  - Else (archive replay): show "← Back to archive" link to `/archive/timeline-builder`.
- Remove the `handleReset` / `getRandomTimeline` random-next behavior.
- Render `<DailyBadge dayNumber={...} date={...} />` above the game when a level entry exists.

### 3. `src/levels/timeline-builder/README.md` (new)

JSON schema doc for authoring daily timelines:

```json
{
  "id": "timeline-2026-06-01",
  "theme": "Space Race",
  "themeEmoji": "🚀",
  "prompt": "Place these milestones in order",
  "difficulty": "medium",
  "events": [
    {
      "id": "sputnik",
      "title": "Sputnik 1 launched",
      "emoji": "🛰️",
      "year": 1957,
      "fact": "First artificial satellite."
    }
    // ... exactly 7 events (matches SLOT_COUNT)
  ]
}
```

Rules:

- Filename must be `YYYY-MM-DD.json`.
- Exactly 7 events.
- `difficulty` is `easy | medium | hard`.
- Events can be authored in any order — they're sorted on reveal.

### 4. No changes needed to

- `src/levels/index.ts` (already globs `./*/*.json`)
- `src/routes/play.$slug.tsx` / `src/routes/archive.$slug.tsx` (already generic on `dailySlug`)
- `src/lib/dailyLock.ts` (slug-keyed already)

## Technical notes

- The fallback seed uses the same FNV-style hash already in `src/levels/index.ts`; for the in-game pool fallback I'll inline a small deterministic pick (same approach used in `ScaleGame`).
- The current `timelines.ts` pool stays as the fallback source — once JSON files are authored, they override per-day automatically.
- Daily-lock state for `timeline-builder` will start fresh (localStorage key `playpile:dailyDone:timeline-builder`).
