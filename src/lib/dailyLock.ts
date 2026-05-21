// Tiny localStorage helper to enforce "one play per game per day".
// A game is locked for today once it's been *completed*. Replays via the
// archive (?date=YYYY-MM-DD) bypass this entirely.
import { formatDate } from "@/levels";

const KEY = (slug: string) => `playpile:dailyDone:${slug}`;

export function markDailyComplete(slug: string, date: string = formatDate(new Date())) {
  try {
    localStorage.setItem(KEY(slug), date);
  } catch {
    /* ignore */
  }
}

export function hasCompletedToday(slug: string): boolean {
  try {
    return localStorage.getItem(KEY(slug)) === formatDate(new Date());
  } catch {
    return false;
  }
}
