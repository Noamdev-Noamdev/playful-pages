import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getGame } from "@/games";
import { getArchiveDates, formatDate } from "@/levels";

export const Route = createFileRoute("/archive/$slug")({
  component: ArchiveForGame,
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game || !game.dailySlug) throw notFound();
    return {
      slug: game.slug,
      title: game.title,
      description: game.description,
      color: game.color,
      dailySlug: game.dailySlug,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Archive` },
          { name: "description", content: `Play every past daily ${loaderData.title} puzzle.` },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-black">No archive</h1>
        <p className="mt-4 text-muted-foreground">This game doesn't have a daily archive yet.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card-yellow px-5 py-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  ),
});

const colorMap: Record<string, string> = {
  pink: "bg-card-pink",
  yellow: "bg-card-yellow",
  mint: "bg-card-mint",
  sky: "bg-card-sky",
  lilac: "bg-card-lilac",
  peach: "bg-card-peach",
  lime: "bg-card-lime",
  coral: "bg-card-coral",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface DayCell {
  date: string;       // YYYY-MM-DD (or "" for blank cell)
  dayOfMonth: number;
  dayNumber?: number; // 1-indexed archive position if level exists
}

function buildMonthGrid(
  year: number,
  monthIdx: number, // 0-11
  dateMap: Map<string, number>,
): DayCell[] {
  const first = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const leadingBlanks = first.getDay(); // 0=Sun
  const cells: DayCell[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ date: "", dayOfMonth: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      date: iso,
      dayOfMonth: d,
      dayNumber: dateMap.get(iso),
    });
  }
  // pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push({ date: "", dayOfMonth: 0 });
  return cells;
}

function ArchiveForGame() {
  const { slug, title, description, color, dailySlug } = Route.useLoaderData();
  const todayKey = formatDate(new Date());
  const dates = getArchiveDates(dailySlug);
  const dateMap = new Map(dates.map((d) => [d.date, d.dayNumber]));

  // Group archive dates by (year, month) so we render a calendar per month
  // that actually has at least one level.
  const monthKeys = new Set<string>();
  for (const { date } of dates) {
    monthKeys.add(date.slice(0, 7)); // YYYY-MM
  }
  // Always include the current month so "today" appears even with no level yet
  monthKeys.add(todayKey.slice(0, 7));

  const months = Array.from(monthKeys)
    .sort()
    .reverse() // newest first
    .map((ym) => {
      const [y, m] = ym.split("-").map(Number);
      return { year: y, monthIdx: m - 1, cells: buildMonthGrid(y, m - 1, dateMap) };
    });

  const accent = colorMap[color] ?? "bg-card";
  const totalLevels = dates.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/play/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {title}
        </Link>

        {/* Header — themed in the game's color */}
        <div className={`mt-8 rounded-3xl border-2 border-foreground ${accent} p-6 sm:p-8`}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">Daily archive</p>
          <h1 className="mt-1 font-display text-5xl font-black leading-none sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm opacity-80 sm:text-base">{description}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider">
            {totalLevels} {totalLevels === 1 ? "puzzle" : "puzzles"} authored
          </p>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm border-2 border-foreground ${accent}`} />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground bg-foreground" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-muted-foreground bg-background" />
            No puzzle
          </span>
        </div>

        {/* Calendars */}
        <div className="mt-8 space-y-10">
          {months.map(({ year, monthIdx, cells }) => (
            <section key={`${year}-${monthIdx}`}>
              <h2 className="mb-3 font-display text-2xl font-black">
                {MONTHS[monthIdx]} <span className="text-muted-foreground">{year}</span>
              </h2>

              <div className="grid grid-cols-7 gap-2">
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}

                {cells.map((cell, i) => {
                  if (!cell.date) {
                    return <div key={i} className="aspect-square" />;
                  }
                  const isToday = cell.date === todayKey;
                  const isFuture = cell.date > todayKey;
                  const hasLevel = cell.dayNumber !== undefined;
                  const isPlayable = hasLevel && !isFuture;

                  const base =
                    "relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-transform";

                  if (isPlayable) {
                    return (
                      <Link
                        key={i}
                        to="/play/$slug"
                        params={{ slug }}
                        search={{ date: cell.date }}
                        className={`${base} border-foreground ${isToday ? "bg-foreground text-background" : accent} hover:-translate-y-0.5`}
                      >
                        <span className="font-display text-base font-black leading-none">
                          {cell.dayOfMonth}
                        </span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-70">
                          #{cell.dayNumber}
                        </span>
                      </Link>
                    );
                  }

                  // No level (or future date): non-clickable
                  return (
                    <div
                      key={i}
                      className={`${base} ${
                        isToday
                          ? "border-foreground bg-foreground text-background"
                          : "border-dashed border-muted-foreground/40 bg-background text-muted-foreground"
                      }`}
                      aria-disabled
                    >
                      <span className="font-display text-base font-black leading-none">
                        {cell.dayOfMonth}
                      </span>
                      {isToday && (
                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
