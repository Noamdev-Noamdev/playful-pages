# Timeline Builder — Daily Levels

Drop one JSON file per day into this folder. The filename **must** be the date the puzzle should go live, formatted `YYYY-MM-DD.json` (local time).

```
src/levels/timeline-builder/2026-06-01.json
src/levels/timeline-builder/2026-06-02.json
```

The file is auto-loaded by `src/levels/index.ts` (Vite glob). No registry edit needed.

## Schema

```jsonc
{
  "id": "timeline-2026-06-01",        // any unique string
  "theme": "Space Race",              // short title shown above the game
  "themeEmoji": "🚀",                  // single emoji
  "prompt": "Order these milestones from earliest to latest",
  "difficulty": "easy" | "medium" | "hard",
  "events": [
    {
      "id": "sputnik",                // unique within this puzzle
      "title": "Sputnik 1 launched",  // short label on the card
      "emoji": "🛰️",
      "year": 1957,                   // integer year (negative for BCE)
      "fact": "First artificial satellite — beep-beep heard worldwide."
    }
    // ... exactly 7 events total
  ]
}
```

## Rules

- **Exactly 7 events** per puzzle (matches the timeline's 7 slots).
- Each `event.id` must be unique inside the puzzle.
- Events can be authored in any order — they're sorted by `year` at reveal.
- `year` is an integer; use negative numbers for BCE (e.g. `-500`).
- Pick `difficulty` based on how spread-out / well-known the years are.

## Fallback behavior

If no JSON exists for today, the game falls back to a **deterministic** pick from the built-in pool in `timelines.ts` — same timeline all day, so the one-puzzle-per-day lock still works. Once you author a JSON for a date, it overrides the fallback for that date.

## Archive

Every authored date automatically appears in the `/archive/timeline-builder` calendar and can be replayed individually.
