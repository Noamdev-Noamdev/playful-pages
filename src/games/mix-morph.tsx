import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank7: Game = {
  slug: "mix-morph",
  title: "Mix & Morph",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "lime",
  category: "originals",
  Component: () => <ComingSoon name="mix-morph" />,
};

export default Blank7;
