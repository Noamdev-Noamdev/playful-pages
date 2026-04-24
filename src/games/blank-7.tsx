import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank7: Game = {
  slug: "blank-7",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "lime",
  category: "originals",
  Component: () => <ComingSoon name="blank-7" />,
};

export default Blank7;
