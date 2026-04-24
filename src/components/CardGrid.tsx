import { PlayCard } from "./PlayCard";
import type { CardItem } from "@/data/cards";

interface CardGridProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: CardItem[];
}

export function CardGrid({ eyebrow, title, subtitle, items }: CardGridProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="mb-10 max-w-2xl sm:mb-14">
        <span className="inline-block rounded-full border-2 border-foreground bg-card-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <PlayCard key={item.title} {...item} />
        ))}
      </div>

      <footer className="mt-20 border-t-2 border-foreground pt-6 text-sm text-muted-foreground">
        Made with curiosity. Best enjoyed slowly.
      </footer>
    </main>
  );
}
