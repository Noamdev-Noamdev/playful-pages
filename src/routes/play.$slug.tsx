import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getGame } from "@/games";

export const Route = createFileRoute("/play/$slug")({
  component: PlayPage,
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game) throw notFound();
    return {
      slug: game.slug,
      title: game.title,
      description: game.description,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — playpile` },
          { name: "description", content: loaderData.description },
        ]
      : [],
  }),
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
          className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card-yellow px-5 py-2 font-semibold transition-transform hover:-translate-y-0.5"
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

function PlayPage() {
  const { slug } = Route.useLoaderData();
  const game = getGame(slug);

  if (!game) return null; // should not happen because of loader

  const Icon = game.icon;
  const GameComponent = game.Component;

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

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">{game.description}</p>

        <div className="mt-12">
          <GameComponent />
        </div>
      </main>
    </div>
  );
}
