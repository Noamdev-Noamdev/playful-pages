import type { Game } from "./types";

import RankAnything from "./rank-anything";
import Signal from "./signal";
import BuildYourOwn from "./build-your-own";
import HowBig from "./how-big";
import TimelineBuilder from "./timeline-builder";
import RealityCheck from "./reality-check";
import OneDecision from "./one-decision";
import MixMorph from "./mix-morph";

import Sudoku from "./sudoku";
import Tectonic from "./tectonic";
import Kakuro from "./kakuro";
import Futoshiki from "./futoshiki";

// Register every game here — one line per game.
export const games: Game[] = [
  Signal,
  RankAnything,
  BuildYourOwn,
  HowBig,
  TimelineBuilder,
  RealityCheck,
  OneDecision,
  MixMorph,
  Sudoku,
  Tectonic,
  Kakuro,
  Futoshiki,
];

export const originals = games.filter((g) => g.category === "originals");
export const classics = games.filter((g) => g.category === "classics");
export const getGame = (slug: string) => games.find((g) => g.slug === slug);

export type { Game } from "./types";
