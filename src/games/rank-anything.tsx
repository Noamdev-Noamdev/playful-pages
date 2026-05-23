import { ArrowUpDown } from "lucide-react";
import type { Game } from "./types";
import { RankGame } from "./rank-anything/RankGame";

const RankAnything: Game = {
  slug: "rank-anything",
  title: "Rank Anything",
  description: "Drag five things into order. You know more than you think.",
  icon: ArrowUpDown,
  color: "pink",
  category: "originals",
  Component: RankGame,
  dailySlug: "rank-anything",
};

export default RankAnything;