import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Sparkles, ArrowRight, PartyPopper } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
  head: () => ({
    meta: [
      { title: "Welcome to Premium — Playpile" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SuccessPage() {
  const { user, refreshTier } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  // Re-fetch the user's tier on mount — the Stripe webhook may have already
  // updated the profile by the time the user lands here.
  useEffect(() => {
    const doRefresh = async () => {
      await refreshTier();
      setRefreshed(true);
    };
    doRefresh();

    // Also poll every 2s for up to 10s in case the webhook is slow
    const interval = setInterval(async () => {
      await refreshTier();
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [refreshTier]);

  const isPremium = user?.tier === "premium";

  return (
    <div className="min-h-screen bg-background">
      <SiteNav showTabs={false} />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
        {/* Celebration icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 border-foreground bg-card-yellow">
          {isPremium ? (
            <Crown className="h-12 w-12" strokeWidth={2} />
          ) : (
            <Sparkles className="h-12 w-12" strokeWidth={2} />
          )}
        </div>

        {isPremium ? (
          <>
            <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">
              Welcome to
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, oklch(0.75 0.17 60), oklch(0.65 0.2 35))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Premium
              </span>
              <span className="ml-2 inline-block animate-bounce">
                <PartyPopper className="inline h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2} />
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground">
              You now have full access to the entire puzzle archive.
              <br />
              Every game, every day, all yours.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">
              Payment received!
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {refreshed
                ? "Your premium access is being activated. This usually takes just a moment..."
                : "Processing your payment..."}
            </p>
            {/* Subtle loading animation */}
            <div className="mx-auto mt-6 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-foreground"
                  style={{
                    animation: "pulse 1.4s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
          >
            Start playing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isPremium && (
          <p className="mt-8 text-xs text-muted-foreground">
            Your subscription can be managed from your Stripe customer portal.
          </p>
        )}

        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
            40% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </main>
    </div>
  );
}
