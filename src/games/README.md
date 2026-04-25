# Games — How to add a new game

Every game in this project is **one self-contained file** in `src/games/`. That file holds both the game's metadata (the card on the home page) and the playable React component (the page at `/play/<slug>`).

To ship a new game you only ever touch **two files**:

1. Create a new file: `src/games/my-game.tsx`
2. Add two lines to `src/games/index.ts` to register it

That's it. The card on the home page, the route, the page header, and the playable game itself are wired up automatically.

---

## 1. The folder

```text
src/games/
  index.ts          ← the registry — add your game here
  types.ts          ← the shared `Game` type
  README.md         ← this file
  _ComingSoon.tsx   ← reusable "coming soon" placeholder
  _DevComplete.tsx  ← reusable dev shortcut button
  _WinOverlay.tsx   ← reusable win screen with confetti
  blank-1.tsx       ← example game files
  blank-2.tsx
  ...
```

> Files starting with `_` are **shared helpers**, not games. Don't register them.

---

## 2. The `Game` shape

Every game file exports a default object that matches the `Game` type from `./types`:

```ts
export interface Game {
  slug: string;          // URL segment, e.g. "sudoku" → /play/sudoku
  title: string;         // Display name on the card and page header
  description: string;   // Short blurb shown on the card
  icon: LucideIcon;      // Any icon from `lucide-react`
  color: CardColor;      // Card background — see colors below
  category: "originals" | "classics";
  Component: ComponentType; // The actual playable React component
}
```

### Available colors

`pink`, `yellow`, `mint`, `sky`, `lilac`, `peach`, `lime`, `coral`

These map to design tokens in `src/styles.css` (`--card-pink`, etc.). To add a new color, add the token there and extend `CardColor` in `src/components/PlayCard.tsx`.

### Picking an icon

Browse [lucide.dev/icons](https://lucide.dev/icons) and import by name:

```ts
import { Dice5, Puzzle, Sparkles } from "lucide-react";
```

---

## 3. Step-by-step: add a new game

### Step A — Create the file

Copy this template into `src/games/my-game.tsx`:

```tsx
import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { Game } from "./types";
import { WinOverlay } from "./_WinOverlay";
import { DevComplete } from "./_DevComplete";

function MyGame() {
  const [won, setWon] = useState(false);

  // ─── Your game logic goes here ────────────────────────────────────
  // Anything React: hooks, Tailwind classes, canvas, audio, whatever.
  // When the player wins, call setWon(true).

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border-2 border-foreground bg-card p-8">
        {/* Your game UI */}
        <p>Your game goes here.</p>
      </div>

      {/* Dev shortcut — comment out the next line when shipping */}
      <DevComplete onComplete={() => setWon(true)} />

      <WinOverlay
        show={won}
        onPlayAgain={() => {
          setWon(false);
          // also reset any game state here
        }}
        message="You win!"
        sub="Nice work."
      />
    </div>
  );
}

const MyGameMeta: Game = {
  slug: "my-game",
  title: "My Game",
  description: "A short, punchy description for the card.",
  icon: Sparkles,
  color: "mint",
  category: "originals", // or "classics"
  Component: MyGame,
};

export default MyGameMeta;
```

### Step B — Register it

Open `src/games/index.ts` and add **two lines**:

```ts
import MyGame from "./my-game";       // ← new import

export const games: Game[] = [
  Blank1,
  // ...
  MyGame,                             // ← new entry
];
```

Save. The card now appears on the home page under the right tab, and `/play/my-game` is live.

---

## 4. Built-in helpers

### `WinOverlay` — the win screen

A full-screen confetti + modal that appears when the player wins. Drive it with a boolean `won` state.

```tsx
<WinOverlay
  show={won}
  onPlayAgain={() => { setWon(false); /* reset state */ }}
  message="Puzzle Solved!"   // optional, defaults to "Puzzle Solved!"
  sub="You cracked it!"      // optional sub-message
/>
```

**Important**: Your `onPlayAgain` callback should reset all game state so the player can immediately play another round.

### `DevComplete` — the dev shortcut button

A small "🛠 Complete" button that lets you instantly trigger the win state while building. **Comment out the single line** before shipping a game:

```tsx
{/* <DevComplete onComplete={() => setWon(true)} /> */}
```

### `ComingSoon` — placeholder

Use it as the `Component` for games you've registered but haven't built yet:

```tsx
import { ComingSoon } from "./_ComingSoon";

const Game: Game = {
  // ...
  Component: () => <ComingSoon name="my-game" />,
};
```

---

## 5. Styling tips

- Use Tailwind classes and the design tokens from `src/styles.css` (`bg-card`, `border-foreground`, `text-muted-foreground`, `bg-card-mint`, etc.). Don't hardcode hex colors in components.
- The page already gives your game a centered `max-w-3xl` container with the title, icon, and back link rendered for you. You only need to render the game itself.
- For game boards, the chunky outlined look (`border-2 border-foreground rounded-3xl`) matches the home cards.

---

## 6. Removing a game

1. Delete the file: `src/games/my-game.tsx`
2. Remove its import and entry from `src/games/index.ts`

The card and route disappear automatically.

---

## 7. If a game gets big

Keep the entry as a single file with one default export, but split helpers into a sibling folder:

```text
src/games/
  sudoku.tsx              ← entry: metadata + Component
  sudoku/
    board.tsx
    solver.ts
    puzzles.ts
```

Then `sudoku.tsx` imports from `./sudoku/board`, etc. Nothing else changes.
