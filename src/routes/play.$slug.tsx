import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getGame } from "@/games";
import { UnderConstruction } from "@/games/_UnderConstruction";
import { DailyLocked } from "@/games/_DailyLocked";
import { hasCompletedToday } from "@/lib/dailyLock";
import { isDevMode } from "@/lib/devMode";

export const Route = createFileRoute("/play/$slug")({
  component: PlayPage,
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
  }),
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game) throw notFound();
    return {
      slug: game.slug,
      title: game.title,
      description: game.description,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [] };
    const url = `https://playpilegames.lovable.app/play/${params.slug}`;
    const title = `${loaderData.title} — Playpile`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: loaderData.description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: loaderData.title,
            description: loaderData.description,
            applicationCategory: "Game",
            operatingSystem: "Web",
            url,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-black">Game not found</h1>
        <p className="mt-4 text-muted-foreground">
          That game doesn't exist yet. Try one from the home page.
        </p>
        <Link
          to="/"
          aria-label="Back to the Playpile home page"
          className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card-yellow px-5 py-2 font-semibold transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all games
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

function PlayPage() {
  const { slug } = Route.useLoaderData();
  const { date } = Route.useSearch();
  const game = getGame(slug);

  // Daily lock: only applies when playing today's daily (no ?date param).
  // Re-checked on focus so finishing a puzzle then returning shows the lock.
  const [locked, setLocked] = useState<boolean>(
    () => !!game?.dailySlug && !date && !isDevMode() && hasCompletedToday(game.slug),
  );
  useEffect(() => {
    if (!game?.dailySlug || date) return;
    const check = () => setLocked(!isDevMode() && hasCompletedToday(game.slug));
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [game?.dailySlug, game?.slug, date]);

  if (!game) return null; // should not happen because of loader

  const Icon = game.icon;
  const GameComponent = game.Component;
  const showSignalInlineBackToToday = !!date && game.slug === "signal";
  const showSharedBackToToday = !!date && !!game.dailySlug && !showSignalInlineBackToToday;
  const todayHref = `/play/${game.slug}`;

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

        <div className="mt-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-foreground ${colorMap[game.color]}`}
            >
              <Icon className="h-10 w-10" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-display text-5xl font-black capitalize leading-none sm:text-6xl">
                {game.title}
              </h1>
            </div>
          </div>

          <div className="hidden shrink-0 flex-col items-end gap-2 self-center sm:flex">
            {game.dailySlug && (
              <Link
                to="/archive/$slug"
                params={{ slug: game.slug }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                <CalendarDays className="h-4 w-4" /> Archive
              </Link>
            )}
          </div>
        </div>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">{game.description}</p>

        {game.dailySlug && (
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
            {game.dailySlug && (
              <Link
                to="/archive/$slug"
                params={{ slug: game.slug }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                <CalendarDays className="h-4 w-4" /> Archive
              </Link>
            )}
          </div>
        )}

        <div className="relative mt-12">
          {showSharedBackToToday && (
            <a
              href={todayHref}
              aria-label="Back to today"
              className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-background text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--foreground)] active:translate-y-0 active:shadow-none sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className="hidden text-[11px] font-black uppercase tracking-wide sm:inline">
                Back to today
              </span>
            </a>
          )}
          <div className={showSharedBackToToday ? "pt-12 sm:pt-10" : ""}>
            {game.underConstruction ? (
              <UnderConstruction name={game.title} />
            ) : locked ? (
              <DailyLocked slug={game.slug} title={game.title} />
            ) : (
              <GameComponent />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
