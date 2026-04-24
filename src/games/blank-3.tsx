import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank3: Game = {
  slug: "blank-3",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "mint",
  category: "originals",
  Component: () => <ComingSoon name="blank-3" />,
};

export default Blank3;
