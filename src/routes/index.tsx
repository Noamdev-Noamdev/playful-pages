import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, type Tab } from "@/components/SiteNav";
import Footer from "@/components/Footer";
import { PlayCard } from "@/components/PlayCard";
import { originals, classics, games } from "@/games";

const HOME_TITLE = "Playpile — Daily Games and Logic Puzzles";
const HOME_DESCRIPTION =
  "A pile of playful, original web experiments and classic logic puzzles — sudoku, tectonic, kakuro, futoshiki, and a new daily game every day.";
const HOME_URL = "https://playpile.org/";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:url", content: HOME_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: HOME_TITLE,
          description: HOME_DESCRIPTION,
          url: HOME_URL,
          hasPart: games
            .filter((g) => !g.underConstruction)
            .map((g) => ({
              "@type": "Game",
              name: g.title,
              description: g.description,
              url: `https://playpile.org/play/${g.slug}`,
            })),
        }),
      },
    ],
  }),
});

const content: Record<
  Tab,
  { eyebrow: string; title: string; subtitle: string; items: typeof originals }
> = {
  originals: {
    eyebrow: "Originals",
    title: "A pile of playful daily games.",
    subtitle: "Hand-built tiny games. New ones appear when nobody's looking.",
    items: originals,
  },
  classics: {
    eyebrow: "Classics",
    title: "Old favorites, freshly painted.",
    subtitle:
      "Timeless logic puzzles — sudoku, tectonic, kakuro, futoshiki — with a fresh coat of color.",
    items: classics,
  },
};

function Index() {
  const [tab, setTab] = useState<Tab>("originals");
  const { eyebrow, title, subtitle, items } = content[tab];

  return (
    <div className="min-h-screen bg-background">
      {/* Stable, single primary heading for crawlers and screen readers */}
      <h1 className="sr-only">Playpile — Original Web Experiments and Classic Logic Puzzles</h1>

      <SiteNav activeTab={tab} onTabChange={setTab} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="mb-10 max-w-2xl sm:mb-14">
          <span className="inline-block rounded-full border-2 border-foreground bg-card-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {eyebrow}
          </span>
          <h2 className="mt-4 font-display text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
            {title}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <PlayCard
              key={item.slug}
              icon={item.icon}
              title={item.title}
              description={item.description}
              color={item.color}
              slug={item.slug}
              underConstruction={item.underConstruction}
            />
          ))}
        </div>

        <Footer />
      </main>
    </div>
  );
}
