import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank1: Game = {
  slug: "blank-1",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "pink",
  category: "originals",
  Component: () => <ComingSoon name="blank-1" />,
};

export default Blank1;
