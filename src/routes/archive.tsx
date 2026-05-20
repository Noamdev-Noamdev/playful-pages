import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { games } from "@/games";
import { getArchiveSize } from "@/levels";

export const Route = createFileRoute("/archive")({
  component: ArchiveIndex,
  head: () => ({
    meta: [
      { title: "Archive — playpile" },
      { name: "description", content: "Play past daily puzzles from every original game." },
    ],
  }),
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

function ArchiveIndex() {
  const withArchives = games
    .filter((g) => g.dailySlug && getArchiveSize(g.dailySlug) > 0)
    .map((g) => ({ game: g, count: getArchiveSize(g.dailySlug!) }));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all games
        </Link>

        <div className="mt-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-foreground bg-card-lilac">
            <CalendarDays className="h-10 w-10" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">Archive</h1>
            <p className="mt-2 text-muted-foreground">Play any past daily puzzle.</p>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          {withArchives.length === 0 && (
            <p className="text-muted-foreground">No daily archives yet.</p>
          )}
          {withArchives.map(({ game, count }) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.slug}
                to="/archive/$slug"
                params={{ slug: game.slug }}
                className="flex items-center gap-4 rounded-3xl border-2 border-foreground bg-card p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground ${colorMap[game.color]}`}>
                  <Icon className="h-7 w-7" strokeWidth={2.25} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-2xl font-black">{game.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? "level" : "levels"} in the archive
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
