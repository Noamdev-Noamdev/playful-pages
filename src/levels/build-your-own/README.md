# Build Your Own — Daily Element

Each day, one **target element** appears in the game. Players try to discover it
by combining elements on the canvas. They can also peek at a hint or use the
"Reveal others" button (which unlocks every element *except* today's target).

## Where the files live

`src/levels/build-your-own/YYYY-MM-DD.json`

The filename **is** the date the puzzle goes live (local time). The newest
file dated on-or-before today becomes today's puzzle. Older files remain in
the archive at `/archive/build-your-own`.

## JSON schema

```json
{
  "id": "rainbow",
  "name": "Rainbow",
  "emoji": "🌈",
  "tier": 2,
  "hint": "Where sunlight meets a passing storm.",
  "recipes": [
    ["rain", "sun"],
    ["light", "rain"]
  ]
}
```

### Fields

| Field     | Type                 | Notes                                                                                              |
|-----------|----------------------|----------------------------------------------------------------------------------------------------|
| `id`      | string               | Unique element id. Lower-snake-case. Must **not** collide with anything in `elements.ts`.          |
| `name`    | string               | Display name shown on the tile and in the toast.                                                   |
| `emoji`   | string               | Single emoji.                                                                                       |
| `tier`    | integer 0–6          | Determines which inventory group it appears in (0=Primordial … 6=Cosmic).                          |
| `hint`    | string               | One short sentence shown behind the "Show hint" button.                                            |
| `recipes` | array of `[a, b]`    | Each pair is two element ids whose combination produces this element. Order in the pair doesn't matter. **Use only ids that exist in `elements.ts`** (or a previous-tier daily, but prefer base elements). At least one recipe required. |

### Rules of thumb

- Pick ingredients players can plausibly assemble from the starting four
  (`fire`, `water`, `earth`, `air`) through the existing combination tree.
- Keep the hint poetic but not a giveaway — 5–10 words is the sweet spot.
- Don't reuse a recipe pair that already produces something else in
  `elements.ts` / `COMBINATIONS` — it will be overridden.
- If no JSON exists for today, the game still runs with no daily target
  (the hint button and "Reveal others" button are hidden).
