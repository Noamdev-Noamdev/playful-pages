import { Sparkles } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Blank4: Game = {
  slug: "blank-4",
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  icon: Sparkles,
  color: "sky",
  category: "originals",
  Component: () => <ComingSoon name="blank-4" />,
};

export default Blank4;
