import {
  Rocket,
  Pizza,
  Globe2,
  Music,
  Palette,
  Brain,
  Cloud,
  Mountain,
  Sparkles,
  Dices,
  Crown,
  Swords,
  Puzzle,
  Spade,
  Hash,
  Bot,
} from "lucide-react";
import type { CardColor } from "@/components/PlayCard";
import type { LucideIcon } from "lucide-react";

export interface CardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: CardColor;
}

export const originals: CardItem[] = [
  { icon: Rocket, title: "Space Drift", description: "Pilot a tiny ship across an infinite, pixel-perfect cosmos.", color: "sky" },
  { icon: Pizza, title: "Slice Theory", description: "How many ways can you cut a pizza? More than you think.", color: "coral" },
  { icon: Globe2, title: "Tiny Planet", description: "Build an entire civilization on a marble-sized world.", color: "mint" },
  { icon: Music, title: "Loop Lab", description: "Stack beats, bend tones, and remix yourself silly.", color: "lilac" },
  { icon: Palette, title: "Color Hunt", description: "Find the exact shade hiding inside everyday photos.", color: "yellow" },
  { icon: Brain, title: "Mind Maze", description: "Riddles that get weirder the closer you get to solving them.", color: "pink" },
  { icon: Cloud, title: "Cloud Sorter", description: "A meditative game about naming the shapes in the sky.", color: "peach" },
  { icon: Mountain, title: "Peak Climb", description: "Tap, breathe, ascend. A rhythm game about patience.", color: "lime" },
  { icon: Sparkles, title: "Wishwell", description: "Drop a wish, watch the ripples reach strangers worldwide.", color: "sky" },
];

export const classics: CardItem[] = [
  { icon: Dices, title: "Yahtzee", description: "Roll five dice. Chase the perfect combination. Repeat.", color: "coral" },
  { icon: Crown, title: "Chess", description: "The eternal game of kings, queens, and quiet brilliance.", color: "yellow" },
  { icon: Swords, title: "Checkers", description: "Hop, jump, crown. Simple rules, infinite mind games.", color: "mint" },
  { icon: Puzzle, title: "Jigsaw", description: "A thousand tiny pieces, one calm afternoon ahead.", color: "lilac" },
  { icon: Spade, title: "Solitaire", description: "Just you, a deck, and the satisfying click of an ace.", color: "pink" },
  { icon: Hash, title: "Sudoku", description: "Nine squares, nine numbers, nine ways to lose track of time.", color: "sky" },
  { icon: Bot, title: "Tic Tac Toe", description: "The first game you ever beat. Play it again, smarter.", color: "peach" },
  { icon: Brain, title: "Memory", description: "Flip the cards. Match the pairs. Trust your brain.", color: "lime" },
];
