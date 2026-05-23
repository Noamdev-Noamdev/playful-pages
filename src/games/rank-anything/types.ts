export interface PuzzleItem {
  name: string;
  emoji: string;
  value: number;   // the hidden numeric value used for sorting
  fact: string;    // revealed after check, e.g. "330 m tall"
}

export interface Puzzle {
  id: number;
  prompt: string;       // "Rank from shortest to tallest"
  promptEmoji: string;  // "📏"
  shareLabel: string;   // short text for the share card, e.g. "by height"
  metric: string;       // shown as subtext below prompt, e.g. "Height (metres)"
  difficulty: "easy" | "medium" | "hard";
  items: PuzzleItem[];  // 5 items per puzzle
}