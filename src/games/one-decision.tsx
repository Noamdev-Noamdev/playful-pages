import { GitBranch } from "lucide-react";
import type { Game } from "./types";
import { DecisionGame } from "./one-decision/DecisionGame";

const OneDecision: Game = {
  slug: "one-decision",
  title: "One Decision",
  description: "One choice. Watch your world unfold — and wonder what if.",
  icon: GitBranch,
  color: "peach",
  category: "originals",
  Component: DecisionGame,
  underConstruction: true,
};

export default OneDecision;