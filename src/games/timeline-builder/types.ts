export interface TimelineEvent {
  id: string;
  title: string;
  emoji: string;
  year: number;
  fact: string; // shown after reveal
}

export interface Timeline {
  id: string;
  theme: string;
  prompt: string;
  themeEmoji: string;
  difficulty: "easy" | "medium" | "hard";
  events: TimelineEvent[]; // stored in any order — sorted on reveal
}

export type Phase = "playing" | "checking" | "correcting" | "revealed";

export interface SlotResult {
  eventId: string;
  placedIdx: number;
  correctIdx: number;
  positionDiff: number; // correctIdx - placedIdx (+ve = event is later than placed)
  score: number; // 10 / 7 / 4 / 1 / 0
}
