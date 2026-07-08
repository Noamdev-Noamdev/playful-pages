import { Link } from "@tanstack/react-router";
import { Lock, Crown, ArrowRight } from "lucide-react";

interface ArchiveGateOverlayProps {
  gameTitle: string;
  gameSlug: string;
  onUpgrade: () => void;
}

export function ArchiveGateOverlay({
  gameTitle,
  gameSlug,
  onUpgrade,
}: ArchiveGateOverlayProps) {
  return (
    <div className="rounded-3xl border-2 border-foreground bg-card p-8 text-center sm:p-12">
      <style>{`
        @keyframes _ag_pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.06); }
        }
        @keyframes _ag_shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <Lock
        className="mx-auto h-12 w-12 text-foreground"
        strokeWidth={2.25}
        style={{ animation: "_ag_pulse 2.4s ease-in-out infinite" }}
      />

      <h2 className="mt-4 font-display text-3xl font-black sm:text-4xl">
        Premium Puzzle
      </h2>

      <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
        This <strong>{gameTitle}</strong> puzzle is from the archive and requires
        a Premium membership to play.
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground px-6 py-2.5 font-bold text-foreground transition-transform hover:-translate-y-0.5"
        style={{
          background:
            "linear-gradient(100deg, var(--card-yellow) 0%, var(--card-peach) 25%, var(--card-lilac) 50%, var(--card-sky) 75%, var(--card-yellow) 100%)",
          backgroundSize: "200% auto",
          animation: "_ag_shimmer 3s linear infinite",
        }}
      >
        <Crown className="h-4 w-4" strokeWidth={2.5} />
        Unlock with Premium
      </button>

      <div className="mt-5">
        <Link
          to="/play/$slug"
          params={{ slug: gameSlug }}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Or play today's free puzzle
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
