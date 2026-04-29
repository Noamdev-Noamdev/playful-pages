export interface Comparison {
  id: number;
  prompt: string;        // "How many times taller is B than A?"
  metric: string;        // "Height" | "Diameter" | "Mass" | "Distance"
  itemA: CompItem;
  itemB: CompItem;       // B is always the larger one
  ratio: number;         // itemB / itemA — always > 1
  maxGuess: number;      // upper bound of the slider for this comparison
  difficulty: "easy" | "medium" | "hard";
  fact: string;          // shown after reveal
}

export interface CompItem {
  name: string;
  emoji: string;
}

export type Phase = "playing" | "revealing" | "revealed" | "done";

export interface RoundResult {
  compId: number;
  guess: number;
  actual: number;
  score: number;
}