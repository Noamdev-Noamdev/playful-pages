import type { Game } from "./types";

import Blank1 from "./blank-1";
import Blank2 from "./blank-2";
import Blank3 from "./blank-3";
import Blank4 from "./blank-4";
import Blank5 from "./blank-5";
import Blank6 from "./blank-6";
import Blank7 from "./blank-7";

import Sudoku from "./sudoku";
import Tectonic from "./tectonic";
import Kakuro from "./kakuro";
import Futoshiki from "./futoshiki";

// Register every game here — one line per game.
export const games: Game[] = [
  Blank1,
  Blank2,
  Blank3,
  Blank4,
  Blank5,
  Blank6,
  Blank7,
  Sudoku,
  Tectonic,
  Kakuro,
  Futoshiki,
];

export const originals = games.filter((g) => g.category === "originals");
export const classics = games.filter((g) => g.category === "classics");
export const getGame = (slug: string) => games.find((g) => g.slug === slug);

export type { Game } from "./types";
