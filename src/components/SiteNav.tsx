import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export type Tab = "originals" | "classics";

interface SiteNavProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  showTabs?: boolean;
}

export function SiteNav({ activeTab, onTabChange, showTabs = true }: SiteNavProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "originals", label: "Originals" },
    { id: "classics", label: "Classics" },
  ];

  return (
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
      </div>
    </header>
  );
}
