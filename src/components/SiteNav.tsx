import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Crown, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { AuthModal } from "@/components/AuthModal";

export type Tab = "originals" | "classics";

interface SiteNavProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  showTabs?: boolean;
}

export function SiteNav({ activeTab, onTabChange, showTabs = true }: SiteNavProps) {
  const { user, logout, upgradeToPremium } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "originals", label: "Originals" },
    { id: "classics", label: "Classics" },
  ];

  const isPremium = user?.tier === "premium";

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-foreground bg-card-yellow">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            playpile
          </Link>

          {showTabs && (
            <nav className="flex items-center gap-1 rounded-full border-2 border-foreground bg-card p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-pressed={isActive}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User actions area */}
          <div className="flex items-center gap-2">
            {!user ? (
              /* Not logged in — show login + upgrade */
              <>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="hidden items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:inline-flex"
                >
                  <User className="h-3.5 w-3.5" />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.15 85), oklch(0.80 0.14 55))",
                  }}
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Premium</span>
                </button>
              </>
            ) : (
              /* Logged in — show user menu */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border-2 border-foreground px-3 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                    isPremium ? "bg-card-yellow" : "bg-card"
                  }`}
                >
                  {isPremium && <Crown className="h-3.5 w-3.5" />}
                  {!isPremium && <User className="h-3.5 w-3.5" />}
                  <span className="hidden max-w-[120px] truncate sm:inline">
                    {user.email.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {menuOpen && (
                  <>
                    {/* Click-away overlay */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-bold">{user.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isPremium ? (
                            <span className="inline-flex items-center gap-1">
                              <Crown className="h-3 w-3" /> Premium member
                            </span>
                          ) : (
                            "Free plan"
                          )}
                        </p>
                      </div>

                      {!isPremium && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setUpgradeOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-muted"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.92 0.1 85 / 30%), oklch(0.90 0.1 55 / 30%))",
                          }}
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade to Premium
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onUpgrade={() => {
          upgradeToPremium();
          setUpgradeOpen(false);
        }}
      />
    </>
  );
}
