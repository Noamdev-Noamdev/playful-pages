import { Scaling } from "lucide-react";
import type { Game } from "./types";
import { ScaleGame } from "./blank-3/ScaleGame";

const HowBigIsIt: Game = {
  slug: "blank-3",
  title: "How Big Is It Really?",
  description: "Guess the scale. The universe is stranger than you think.",
  icon: Scaling,
  color: "mint",
  category: "originals",
  Component: ScaleGame,
};

export default HowBigIsIt;