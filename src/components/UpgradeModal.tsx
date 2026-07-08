import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Crown, Lock, Sparkles, X } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

const freeFeatures = [
  { text: "Last 7 daily puzzles", included: true },
  { text: "Basic game access", included: true },
  { text: "Full puzzle archive", included: false },
  { text: "All puzzle types", included: false },
  { text: "Priority new features", included: false },
];

const premiumFeatures = [
  { text: "Last 7 daily puzzles", included: true },
  { text: "Basic game access", included: true },
  { text: "Full puzzle archive", included: true },
  { text: "All puzzle types", included: true },
  { text: "Priority new features", included: true },
];

export function UpgradeModal({ open, onOpenChange, onUpgrade }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-3xl border-2 border-foreground p-0 sm:rounded-3xl">
        <DialogHeader className="px-6 pt-6 text-center sm:text-center">
          <DialogTitle className="font-display text-2xl font-black tracking-tight sm:text-3xl">
            Unlock the full experience
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose the plan that works for you. Upgrade anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {/* ── Free Plan ── */}
          <div className="flex flex-col rounded-2xl border-2 border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="font-display text-lg font-extrabold">Free</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Your current plan</p>
            </div>

            <p className="mb-5 font-display text-3xl font-black tracking-tight">
              $0
              <span className="text-base font-semibold text-muted-foreground">/month</span>
            </p>

            <ul className="flex flex-col gap-2.5">
              {freeFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2.5} />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" strokeWidth={2.5} />
                  )}
                  <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <button
                type="button"
                disabled
                className="w-full rounded-full border-2 border-border bg-muted px-5 py-2.5 text-sm font-bold text-muted-foreground"
              >
                Current plan
              </button>
            </div>
          </div>

          {/* ── Premium Plan ── */}
          <div className="relative flex flex-col sm:scale-[1.03] sm:origin-center">
            {/* Animated gradient glow border */}
            <div
              className="absolute -inset-[2px] rounded-[18px] opacity-75 blur-[2px]"
              style={{
                background:
                  "conic-gradient(from var(--glow-angle, 0deg), oklch(0.85 0.16 85), oklch(0.8 0.14 60), oklch(0.9 0.15 95), oklch(0.85 0.16 85))",
                animation: "glow-spin 4s linear infinite",
              }}
            />
            <div
              className="relative flex flex-col rounded-2xl border-2 p-5"
              style={{
                borderColor: "oklch(0.8 0.14 75)",
                background:
                  "linear-gradient(135deg, oklch(0.99 0.01 90) 0%, oklch(0.97 0.03 85) 100%)",
              }}
            >
              {/* Most Popular badge */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "linear-gradient(135deg, oklch(0.85 0.16 85), oklch(0.78 0.15 55))",
                  color: "oklch(0.25 0.04 60)",
                }}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                  Most Popular
                </span>
              </div>

              <div className="mb-4 mt-1">
                <h3 className="flex items-center gap-2 font-display text-lg font-extrabold">
                  <Crown
                    className="h-5 w-5"
                    strokeWidth={2.5}
                    style={{ color: "oklch(0.72 0.17 60)" }}
                  />
                  Premium
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Full access to everything</p>
              </div>

              <p className="mb-5 font-display text-3xl font-black tracking-tight">
                $3.99
                <span className="text-base font-semibold text-muted-foreground">/month</span>
              </p>

              <ul className="flex flex-col gap-2.5">
                {premiumFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2 text-sm">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "oklch(0.85 0.16 85)" }}
                    >
                      <Check
                        className="h-3 w-3"
                        strokeWidth={3}
                        style={{ color: "oklch(0.3 0.06 60)" }}
                      />
                    </span>
                    <span className="font-medium text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="group w-full rounded-full border-2 border-foreground px-5 py-2.5 font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)]"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.88 0.17 85), oklch(0.82 0.16 60))",
                    color: "oklch(0.2 0.04 60)",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles
                      className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12"
                      strokeWidth={2.5}
                    />
                    Upgrade Now
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          Cancel anytime · No commitment · Instant access
        </div>

        {/* Inline keyframes for the glow animation */}
        <style>{`
          @property --glow-angle {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
          }
          @keyframes glow-spin {
            to {
              --glow-angle: 360deg;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
