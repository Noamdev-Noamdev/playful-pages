import { Hash } from "lucide-react";
import type { Game } from "./types";
import { ComingSoon } from "./_ComingSoon";

const Sudoku: Game = {
  slug: "sudoku",
  title: "Sudoku",
  description: "Nine squares, nine numbers, nine ways to lose track of time.",
  icon: Hash,
  color: "sky",
  category: "classics",
  Component: () => <ComingSoon name="sudoku" />,
};

export default Sudoku;
