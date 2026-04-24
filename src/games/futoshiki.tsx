import { ChevronsRight } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Futoshiki: Game = {
  slug: "futoshiki",
  title: "Futoshiki",
  description: "Greater than, less than. A quiet duel of inequalities.",
  icon: ChevronsRight,
  color: "lilac",
  category: "classics",
  Component: () => <ComingSoon name="futoshiki" />,
};

export default Futoshiki;
