import { Scaling } from "lucide-react";
import type { Game } from "./types";
import { ScaleGame } from "./how-big/ScaleGame";

const HowBigIsIt: Game = {
  slug: "how-big",
  title: "How Big Is It Really?",
  description: "Guess the scale. The universe is stranger than you think.",
  icon: Scaling,
  color: "mint",
  category: "originals",
  Component: ScaleGame,
  dailySlug: "how-big",
};

export default HowBigIsIt;
