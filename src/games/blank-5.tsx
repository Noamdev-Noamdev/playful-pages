import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank5: Game = {
  slug: "blank-5",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "lilac",
  category: "originals",
  Component: () => <ComingSoon name="blank-5" />,
};

export default Blank5;
