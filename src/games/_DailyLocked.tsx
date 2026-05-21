import { Link } from "@tanstack/react-router";
import { CalendarDays, Sparkles } from "lucide-react";

export function DailyLocked({ slug, title }: { slug: string; title: string }) {
  return (
    <div className="rounded-3xl border-2 border-foreground bg-card p-8 text-center sm:p-12">
      <Sparkles className="mx-auto h-12 w-12" strokeWidth={2.25} />
      <h2 className="mt-4 font-display text-3xl font-black sm:text-4xl">
        See you tomorrow!
      </h2>
      <p className="mt-3 text-muted-foreground">
        You've already finished today's <strong>{title}</strong>. A new puzzle drops at midnight.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Want more? Replay any past day from the archive.
      </p>
      <Link
        to="/archive/$slug"
        params={{ slug }}
        className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card-yellow px-5 py-2.5 font-bold transition-transform hover:-translate-y-0.5"
      >
        <CalendarDays className="h-4 w-4" /> Open archive
      </Link>
    </div>
  );
}
