export interface SizeVizData {
    type: "size";
    labelA: string; emojiA: string; valueA: number;
    labelB: string; emojiB: string; valueB: number;
    unit: string;
}

export interface BarVizData {
    type: "bar";
    labelA: string; emojiA: string; valueA: number;
    labelB: string; emojiB: string; valueB: number;
    unit: string;
}

export interface QuantityVizData {
    type: "quantity";
    labelA: string; emojiA: string; countA: number; realA: string;
    labelB: string; emojiB: string; countB: number; realB: string;
}

export interface TimeEvent {
    label: string;
    emoji: string;
    year: number;      // negative = BC; very negative = prehistoric (in actual years)
    display: string;   // e.g. "66 million years ago" | "2560 BC" | "1969"
}

export interface TimeVizData {
    type: "time";
    events: TimeEvent[]; // 2–4 events; sorted by year on render
}

export type VizData = SizeVizData | BarVizData | QuantityVizData | TimeVizData;

export interface Claim {
    id: string;
    statement: string;
    answer: boolean;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    explanation: string;
    viz: VizData;
}

export type Phase = "playing" | "revealing" | "revealed" | "done";

export interface RoundResult {
    claimId: string;
    choice: boolean;
    correct: boolean;
}