# Reality Check — Daily Levels

Drop one JSON file per day into this folder. Filename **must** be `YYYY-MM-DD.json` (local time). The file is auto-loaded by `src/levels/index.ts` (Vite glob) — no registry edit needed.

Each daily level is a curated set of **exactly 5 claims** played in order.

## Schema

```jsonc
{
  "id": "rc-2026-06-01",            // any unique string
  "claims": [
    {
      "id": "c1",                   // unique within this level
      "statement": "The Eiffel Tower is taller than Mount Fuji",
      "answer": false,              // true / false
      "difficulty": "easy",         // "easy" | "medium" | "hard"
      "category": "Size",           // Size | Speed | Distance | Quantity | History
      "explanation": "Mount Fuji is 3,776 m — over 11× the Eiffel Tower.",
      "viz": { /* one of the viz shapes below */ }
    }
    // ... exactly 5 claims
  ]
}
```

## Viz shapes

### `size` — physical size/height/weight comparison
```jsonc
{
  "type": "size",
  "labelA": "Eiffel Tower", "emojiA": "🗼", "valueA": 330,
  "labelB": "Mount Fuji",   "emojiB": "🗻", "valueB": 3776,
  "unit": "m tall"
}
```

### `bar` — generic bar comparison (speed, distance, etc.)
```jsonc
{
  "type": "bar",
  "labelA": "Cheetah",  "emojiA": "🐆", "valueA": 120,
  "labelB": "Peregrine","emojiB": "🦅", "valueB": 390,
  "unit": "km/h"
}
```

### `quantity` — counted things (use small `countA`/`countB` for emoji grid, real label for text)
```jsonc
{
  "type": "quantity",
  "labelA": "Mammal species", "emojiA": "🐾", "countA": 6400,   "realA": "~6,400",
  "labelB": "Beetle species", "emojiB": "🐞", "countB": 400000, "realB": "~400,000"
}
```

### `time` — timeline of 2–4 historical events
```jsonc
{
  "type": "time",
  "events": [
    { "label": "Great Pyramid", "emoji": "🏔️", "year": -2560, "display": "2560 BC" },
    { "label": "Cleopatra",     "emoji": "👑", "year": -30,   "display": "30 BC" },
    { "label": "Moon landing",  "emoji": "🌕", "year": 1969,  "display": "1969 AD" }
  ]
}
```

## Rules

- **Exactly 5 claims** per level.
- Each `claim.id` must be unique inside the level.
- Pick a mix of categories and difficulties for variety.

## Fallback

If no JSON exists for today's date, the game falls back to a **deterministic** seeded pick of 5 claims from the built-in pool in `claims.ts` — same set all day, so the once-per-day lock still works. Once you author a JSON for a date, it overrides the fallback.

## Archive

Every authored date automatically appears in `/archive/reality-check`.
