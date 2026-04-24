import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank6: Game = {
  slug: "blank-6",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "peach",
  category: "originals",
  Component: () => <ComingSoon name="blank-6" />,
};

export default Blank6;
