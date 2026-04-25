import { Calculator } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Kakuro: Game = {
  slug: "kakuro",
  title: "Kakuro",
  description: "A crossword for math lovers. Make the sums add up.",
  icon: Calculator,
  color: "coral",
  category: "classics",
  Component: () => <ComingSoon name="kakuro" />,
};

export default Kakuro;
