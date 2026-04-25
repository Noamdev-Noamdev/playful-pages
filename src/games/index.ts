import type { Game } from "./types";

import Blank1 from "./blank-1";
import Blank2 from "./blank-2";
import Blank3 from "./blank-3";
import Blank4 from "./blank-4";
import Blank5 from "./blank-5";
import Blank6 from "./blank-6";
import Blank7 from "./blank-7";

// Register every game here — one line per game.
// See README.md in this folder for instructions on adding new games.
export const games: Game[] = [
  Blank1,
  Blank2,
  Blank3,
  Blank4,
  Blank5,
  Blank6,
  Blank7,
];

export const originals = games.filter((g) => g.category === "originals");
export const classics = games.filter((g) => g.category === "classics");
export const getGame = (slug: string) => games.find((g) => g.slug === slug);

export type { Game } from "./types";
