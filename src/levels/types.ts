export interface LevelEntry<T = unknown> {
  /** ISO date the level goes live, format YYYY-MM-DD */
  date: string;
  /** 1-indexed position in the chronological archive */
  dayNumber: number;
  /** The raw puzzle data (shape is game-specific) */
  data: T;
}
