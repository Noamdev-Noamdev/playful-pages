export interface StatChanges {
  population?: number;
  economy?: number;
  environment?: number;
}

export interface SimEvent {
  id: string;
  progress: number; // 0-100: when this event fires
  title: string;
  description: string;
  changes: StatChanges;
}

export interface Choice {
  id: string;
  label: string;
  tagline: string;
  events: SimEvent[];
  endStats: { population: number; economy: number; environment: number };
  finalOutcome: string;
}

export interface Scenario {
  id: string;
  question: string;
  subtitle: string;
  choices: Choice[];
}

export interface SimStats {
  population: number; // 0-100
  economy: number; // 0-100
  environment: number; // 0-100
}

export type Phase = "choosing" | "simulating" | "done";

export interface GameState {
  scenarioId: string;
  choiceId: string;
  progress: number; // 0-100
  stats: SimStats;
  firedEventIds: Set<string>;
  latestEvent: SimEvent | null;
}
