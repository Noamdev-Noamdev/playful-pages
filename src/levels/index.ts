import type { LevelEntry } from "./types";

// Eagerly import every JSON file under src/levels/<slug>/<YYYY-MM-DD>.json.
// Vite bundles them at build time — no manual registry needed.
const modules = import.meta.glob("./*/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface RawEntry {
  date: string;
  data: unknown;
}

// archives: { "<slug>": [{date, data}, ...] } sorted by date asc
const archives: Record<string, RawEntry[]> = (() => {
  const acc: Record<string, RawEntry[]> = {};
  for (const path in modules) {
    // path looks like "./rank-anything/2026-05-19.json"
    const match = path.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, slug, name] = match;
    if (!DATE_RE.test(name)) {
      console.warn(`[levels] Skipping ${path} — filename must be YYYY-MM-DD.json`);
      continue;
    }
    (acc[slug] ??= []).push({ date: name, data: modules[path] });
  }
  for (const slug in acc) {
    acc[slug].sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  return acc;
})();

/** Format a Date as YYYY-MM-DD in local time. */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Cheap deterministic hash of a string → non-negative int. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const memo = new Map<string, LevelEntry<unknown> | null>();

/**
 * Get today's level for a given game slug.
 *
 * Selection rules:
 * 1. If the archive has entries dated ≤ `today`, return the latest one.
 * 2. Otherwise (future-dated archive), pick deterministically by date hash so
 *    the game is always playable.
 * 3. Returns `null` if the game has no level folder at all.
 */
export function getDailyLevel<T = unknown>(
  slug: string,
  today: Date = new Date(),
): LevelEntry<T> | null {
  const todayKey = formatDate(today);
  const cacheKey = `${slug}::${todayKey}`;
  if (memo.has(cacheKey)) return memo.get(cacheKey) as LevelEntry<T> | null;

  const archive = archives[slug];
  if (!archive || archive.length === 0) {
    memo.set(cacheKey, null);
    return null;
  }

  // Find the latest entry whose date is ≤ today.
  let pickIdx = -1;
  for (let i = archive.length - 1; i >= 0; i--) {
    if (archive[i].date <= todayKey) {
      pickIdx = i;
      break;
    }
  }

  // Fallback: archive is entirely in the future → deterministic pick.
  if (pickIdx === -1) {
    pickIdx = hashString(todayKey) % archive.length;
  }

  const entry = archive[pickIdx];
  const result: LevelEntry<T> = {
    date: entry.date,
    dayNumber: pickIdx + 1,
    data: entry.data as T,
  };
  memo.set(cacheKey, result);
  return result;
}

/** Look up a specific dated level for a game. */
export function getLevelByDate<T = unknown>(slug: string, date: string): LevelEntry<T> | null {
  const archive = archives[slug];
  if (!archive) return null;
  const idx = archive.findIndex((e) => e.date === date);
  if (idx === -1) return null;
  return {
    date: archive[idx].date,
    dayNumber: idx + 1,
    data: archive[idx].data as T,
  };
}

/** Total count of authored levels for a game. */
export function getArchiveSize(slug: string): number {
  return archives[slug]?.length ?? 0;
}

/** All authored dates for a game, sorted ascending. Each entry is `{ date, dayNumber }`. */
export function getArchiveDates(slug: string): Array<{ date: string; dayNumber: number }> {
  const archive = archives[slug];
  if (!archive) return [];
  return archive.map((e, i) => ({ date: e.date, dayNumber: i + 1 }));
}

/** All game slugs that have at least one authored level. */
export function listArchiveSlugs(): string[] {
  return Object.keys(archives).filter((s) => archives[s].length > 0);
}

/**
 * Check if a specific dated level is within the last N authored levels
 * (i.e. playable for free users). Defaults to last 7 levels.
 */
export function isLevelFree(slug: string, date: string, freeCount = 7): boolean {
  const archive = archives[slug];
  if (!archive || archive.length === 0) return true;

  const todayKey = formatDate(new Date());
  // Only consider levels that have been published (date <= today)
  const publishedDates = archive
    .filter((e) => e.date <= todayKey)
    .map((e) => e.date);

  if (publishedDates.length === 0) return true;

  const cutoffIndex = Math.max(0, publishedDates.length - freeCount);
  const freeDates = new Set(publishedDates.slice(cutoffIndex));
  return freeDates.has(date);
}

/**
 * Get the set of dates that are free (last N levels) for a game.
 * Returns a Set of YYYY-MM-DD strings.
 */
export function getFreeDates(slug: string, freeCount = 7): Set<string> {
  const archive = archives[slug];
  if (!archive || archive.length === 0) return new Set();

  const todayKey = formatDate(new Date());
  const publishedDates = archive
    .filter((e) => e.date <= todayKey)
    .map((e) => e.date);

  const cutoffIndex = Math.max(0, publishedDates.length - freeCount);
  return new Set(publishedDates.slice(cutoffIndex));
}

export type { LevelEntry } from "./types";
