import {
  Sparkles,
  Hash,
  Grid3x3,
  Calculator,
  ChevronsRight,
} from "lucide-react";
import type { CardColor } from "@/components/PlayCard";
import type { LucideIcon } from "lucide-react";

export interface CardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: CardColor;
  slug: string;
}

// Placeholder originals — to be replaced with real game ideas later.
export const originals: CardItem[] = Array.from({ length: 7 }, (_, i) => ({
  icon: Sparkles,
  title: "blank",
  description: "Coming soon — a brand new original experiment.",
  color: (["pink", "yellow", "mint", "sky", "lilac", "peach", "lime"] as CardColor[])[i],
  slug: `blank-${i + 1}`,
}));

export const classics: CardItem[] = [
  {
    icon: Hash,
    title: "Sudoku",
    description: "Nine squares, nine numbers, nine ways to lose track of time.",
    color: "sky",
    slug: "sudoku",
  },
  {
    icon: Grid3x3,
    title: "Tectonic",
    description: "Fill the regions so no neighbors match. Logic in tiny tiles.",
    color: "mint",
    slug: "tectonic",
  },
  {
    icon: Calculator,
    title: "Kakuro",
    description: "A crossword for math lovers. Make the sums add up.",
    color: "coral",
    slug: "kakuro",
  },
  {
    icon: ChevronsRight,
    title: "Futoshiki",
    description: "Greater than, less than. A quiet duel of inequalities.",
    color: "lilac",
    slug: "futoshiki",
  },
];

export const allGames = [...originals, ...classics];
