import { ArrowUpDown } from "lucide-react";
import type { Game } from "./types";
import { RankGame } from "./blank-1/RankGame";

const RankAnything: Game = {
  slug: "blank-1",
  title: "Rank Anything",
  description: "Drag five things into order. You know more than you think.",
  icon: ArrowUpDown,
  color: "pink",
  category: "originals",
  Component: RankGame,
};

export default RankAnything;