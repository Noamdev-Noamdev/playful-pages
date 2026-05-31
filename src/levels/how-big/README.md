# How Big Is It Really? — Daily Level Format

This folder holds one JSON file per dated daily set for the
**How Big Is It Really?** game.

```
src/levels/how-big/<YYYY-MM-DD>.json
```

Each file is a single object with a unique `id` and a `rounds` array of
**exactly 5 comparisons** — the player plays all five in order.

## Shape

```json
{
  "id": 20260519,
  "rounds": [
    {
      "id": 1,
      "prompt": "How many times longer is a Blue Whale than a Human?",
      "metric": "Length",
      "itemA": { "name": "Human", "emoji": "🧍" },
      "itemB": { "name": "Blue Whale", "emoji": "🐋" },
      "ratio": 14.5,
      "maxGuess": 50,
      "difficulty": "easy",
      "fact": "A blue whale is ~29 m long vs an average human's 1.7 m."
    }
    /* 4 more rounds */
  ]
}
```

| Field                 | Type                           | Notes                                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `id`                  | number                         | Unique — recommend `YYYYMMDD`                                     |
| `rounds`              | array (length 5)               | Each round is a Comparison (see below)                            |
| `rounds[].id`         | number                         | Unique within the set                                             |
| `rounds[].prompt`     | string                         | Question shown above the circles                                  |
| `rounds[].metric`     | string                         | Subtitle (e.g. "Height", "Mass", "Distance")                      |
| `rounds[].itemA`      | `{ name, emoji }`              | The **smaller** item (fixed-size circle)                          |
| `rounds[].itemB`      | `{ name, emoji }`              | The **larger** item (animated circle)                             |
| `rounds[].ratio`      | number > 1                     | How many times bigger B is than A                                 |
| `rounds[].maxGuess`   | number                         | Top of the slider — set ~2–3× the true ratio so it stays winnable |
| `rounds[].difficulty` | `"easy" \| "medium" \| "hard"` | Drives the colored badge                                          |
| `rounds[].fact`       | string                         | Shown after reveal                                                |

## Rules

- Filename **must** be `YYYY-MM-DD.json`. That's the day it goes live.
- The shape must match exactly — extra/missing fields will break the round.
- `ratio` is always **> 1**: B is bigger. Flip the items if needed.
- Pick `maxGuess` thoughtfully — too low makes it trivial, too high makes the
  slider feel useless.
- Keep `id` unique per file; `YYYYMMDD` (set) and `<set><n>` for rounds works well.

## Workflow

1. Create `src/levels/how-big/<YYYY-MM-DD>.json`.
2. Paste the object above with your 5 rounds.
3. Save — it goes live on that date. The archive page picks it up automatically.

## Testing

Visit `/play/how-big?date=2026-05-19` to play any specific dated set
without waiting for the calendar.
