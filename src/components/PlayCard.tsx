import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type CardColor =
  | "pink"
  | "yellow"
  | "mint"
  | "sky"
  | "lilac"
  | "peach"
  | "lime"
  | "coral";

const colorMap: Record<CardColor, string> = {
  pink: "bg-card-pink",
  yellow: "bg-card-yellow",
  mint: "bg-card-mint",
  sky: "bg-card-sky",
  lilac: "bg-card-lilac",
  peach: "bg-card-peach",
  lime: "bg-card-lime",
  coral: "bg-card-coral",
};

interface PlayCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: CardColor;
  slug: string;
}

export function PlayCard({ icon: Icon, title, description, color, slug }: PlayCardProps) {
  return (
    <Link
      to="/play/$slug"
      params={{ slug }}
      className="group relative block rounded-3xl border-2 border-foreground bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-[6px_6px_0_0_var(--foreground)] sm:p-6"
    >
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground ${colorMap[color]} transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-105`}
      >
        <Icon className="h-8 w-8 text-foreground" strokeWidth={2.25} />
      </div>
      <h3 className="font-display text-2xl font-extrabold leading-tight text-foreground capitalize">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

export type { CardColor };
