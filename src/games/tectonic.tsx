import { Grid3x3 } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Tectonic: Game = {
  slug: "tectonic",
  title: "Tectonic",
  description: "Fill the regions so no neighbors match. Logic in tiny tiles.",
  icon: Grid3x3,
  color: "mint",
  category: "classics",
  Component: () => <ComingSoon name="tectonic" />,
};

export default Tectonic;
