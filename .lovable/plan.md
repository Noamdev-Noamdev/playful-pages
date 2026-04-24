# Easy "Add a New Game" System

Right now, adding a game means editing `src/data/cards.ts` AND editing the shared `play.$slug.tsx` placeholder. Let's restructure so each game lives in **one self-contained file** that holds both its metadata (icon, title, description, color, category) and its actual playable React component. The card grid and the play page will read from a single registry — no other files need to change when you add a game.

## What you'll get

To add a new game, you'll do exactly this:

1. Create one file: `src/games/my-game.tsx`
2. Add one line to `src/games/index.ts` to register it

That's it. The card on the home page, the route at `/play/my-game`, the page title, and the playable game itself — all wired up automatically.

## Folder structure

```text
src/
  games/
    index.ts              ← the registry (one line per game)
    types.ts              ← shared Game type
    sudoku.tsx            ← one file = metadata + playable component
    tectonic.tsx
    kakuro.tsx
    futoshiki.tsx
    blank-1.tsx           ← placeholder originals
    ...
```

## What each game file looks like

Every game file exports a default object with metadata + a `Component`:

```tsx
// src/games/sudoku.tsx
import { Hash } from "lucide-react";
import type { Game } from "./types";

const Sudoku: Game = {
  slug: "sudoku",
  title: "Sudoku",
  description: "Nine squares, nine numbers, nine ways to lose track of time.",
  icon: Hash,
  color: "sky",
  category: "classics",
  Component: () => {
    // ← the actual playable game lives here
    return <div>Sudoku board goes here</div>;
  },
};

export default Sudoku;
```

## The registry (one line per game)

```ts
// src/games/index.ts
import Sudoku from "./sudoku";
import Tectonic from "./tectonic";
// ...add new imports here
import type { Game } from "./types";

export const games: Game[] = [Sudoku, Tectonic /*, NewGame */];

export const originals = games.filter((g) => g.category === "originals");
export const classics  = games.filter((g) => g.category === "classics");
export const getGame = (slug: string) => games.find((g) => g.slug === slug);
```

## How the existing pages use it

- **`src/routes/index.tsx`** — instead of importing from `data/cards`, it imports `originals` and `classics` from `src/games`. The card grid stays exactly as it is.
- **`src/routes/play.$slug.tsx`** — looks up the game with `getGame(slug)` and renders `<game.Component />` in place of the current "The game lives here" placeholder. The header (icon, title, description, back link) stays.
- **`src/data/cards.ts`** — deleted. All game info now lives in `src/games/`.

## Migration of current games

I'll create files for the 4 classics + 7 blank originals using the existing icons/colors/descriptions, each with a simple "Coming soon" placeholder component. The site looks identical, but the architecture is ready for real games.

## Adding the actual game code later

When you want to build, say, real Sudoku:
1. Open `src/games/sudoku.tsx`
2. Replace the placeholder `Component` with your Sudoku board logic (it's just a normal React component — use hooks, Tailwind, anything)
3. Save. Done.

If a game grows large, you can split helpers into a sibling folder (`src/games/sudoku/`) and import them — but the entry stays one file with one default export.

## Technical notes

- `Game` type lives in `src/games/types.ts` and re-exports the existing `CardColor` from `PlayCard.tsx` so colors stay tied to the design system.
- `category: "originals" | "classics"` replaces the two separate arrays — adding a game just means setting the category, no need to add it to two places.
- The play route's loader becomes `getGame(params.slug)` and throws `notFound()` if missing (same behavior as today).
- For heavy games later, we can swap the static imports in `games/index.ts` for `React.lazy()` per game without touching any other file. Not needed yet.
- No build config changes, no new dependencies.
