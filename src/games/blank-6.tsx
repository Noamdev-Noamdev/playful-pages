import { GitBranch } from "lucide-react";
import type { Game } from "./types";
import { DecisionGame } from "./blank-6/DecisionGame";

const OneDecision: Game = {
  slug: "blank-6",
  title: "One Decision",
  description: "One choice. Watch your world unfold — and wonder what if.",
  icon: GitBranch,
  color: "peach",
  category: "originals",
  Component: DecisionGame,
};

export default OneDecision;