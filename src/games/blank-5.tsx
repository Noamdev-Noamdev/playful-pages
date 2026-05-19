import { Zap } from "lucide-react";
import type { Game } from "./types";
import { RealityCheck } from "./blank-5/RealityCheck";

const RealityCheckGame: Game = {
  slug: "blank-5",
  title: "Reality Check",
  description: "True or false? Your instincts are about to be humbled.",
  icon: Zap,
  color: "lilac",
  category: "originals",
  Component: RealityCheck,
};

export default RealityCheckGame;