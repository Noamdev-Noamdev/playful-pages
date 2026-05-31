import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, type Tab } from "@/components/SiteNav";
import { PlayCard } from "@/components/PlayCard";
import { originals, classics } from "@/games";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Playpile" },
      {
        name: "description",
        content: "A pile of playful, original web experiments and classic logic puzzles.",
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
      <SiteNav activeTab={tab} onTabChange={setTab} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="mb-10 max-w-2xl sm:mb-14">
          <span className="inline-block rounded-full border-2 border-foreground bg-card-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
            {title}
          </h1>
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

        <footer className="mt-20 border-t-2 border-foreground pt-6 text-sm text-muted-foreground">
          Made with curiosity. Best enjoyed slowly.
        </footer>
      </main>
    </div>
  );
}
