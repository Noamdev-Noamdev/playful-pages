import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getGame } from "@/games";
import { getArchiveDates, formatDate } from "@/levels";

export const Route = createFileRoute("/archive/$slug")({
  component: ArchiveForGame,
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game || !game.dailySlug) throw notFound();
    return { slug: game.slug, title: game.title, dailySlug: game.dailySlug };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.title} — Archive` }]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-black">No archive</h1>
        <p className="mt-4 text-muted-foreground">This game doesn't have a daily archive.</p>
        <Link
          to="/archive"
          className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card-yellow px-5 py-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to archive
        </Link>
      </div>
    </div>
  ),
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function pretty(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

function ArchiveForGame() {
  const { slug, title, dailySlug } = Route.useLoaderData();
  const today = formatDate(new Date());
  const dates = getArchiveDates(dailySlug).slice().reverse(); // newest first

  return (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/archive"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to archive
        </Link>

        <div className="mt-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-foreground bg-card-lilac">
            <CalendarDays className="h-10 w-10" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">{title}</h1>
            <p className="mt-2 text-muted-foreground">{dates.length} daily levels — pick one to play.</p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dates.map(({ date, dayNumber }) => {
            const isFuture = date > today;
            const isToday = date === today;
            return (
              <Link
                key={date}
                to="/play/$slug"
                params={{ slug }}
                search={{ date }}
                className={`flex items-center gap-3 rounded-2xl border-2 border-foreground p-4 transition-transform hover:-translate-y-0.5 ${
                  isToday ? "bg-card-yellow" : isFuture ? "bg-muted opacity-60" : "bg-card"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-background font-display text-lg font-black">
                  #{dayNumber}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{pretty(date)}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {isToday ? "Today" : isFuture ? "Upcoming" : "Play"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
