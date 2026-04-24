import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-foreground bg-card-yellow">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          playpile
        </Link>

        <nav className="flex items-center gap-1 rounded-full border-2 border-foreground bg-card p-1">
          <Link
            to="/"
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-foreground [&.active]:text-background"
            activeOptions={{ exact: true }}
          >
            Originals
          </Link>
          <Link
            to="/classics"
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-foreground [&.active]:text-background"
          >
            Classics
          </Link>
        </nav>
      </div>
    </header>
  );
}
