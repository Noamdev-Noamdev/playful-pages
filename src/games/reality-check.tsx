import { Zap } from "lucide-react";
import type { Game } from "./types";
import { RealityCheck } from "./reality-check/RealityCheck";

const RealityCheckGame: Game = {
  slug: "reality-check",
  title: "Reality Check",
  description: "True or false? Your instincts are about to be humbled.",
  icon: Zap,
  color: "lilac",
  category: "originals",
  Component: RealityCheck,
  dailySlug: "reality-check",
};

export default RealityCheckGame;
