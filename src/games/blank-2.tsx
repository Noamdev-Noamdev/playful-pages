import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank2: Game = {
  slug: "blank-2",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "yellow",
  category: "originals",
  Component: () => <ComingSoon name="blank-2" />,
};

export default Blank2;
