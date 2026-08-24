import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // percentage change, positive = good
  trendInverted?: boolean; // if true, negative trend is good (e.g., bounce rate going down)
  color: string; // Tailwind bg class like 'bg-card-yellow'
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendInverted,
  color,
  loading,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  let trendIsGood = isPositiveTrend;
  if (trendInverted) {
    trendIsGood = isNegativeTrend;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-foreground rounded-2xl p-5 shadow-[4px_4px_0_0_var(--foreground)]",
        color,
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-background/50 rounded-xl border-2 border-foreground/10">{icon}</div>
        <h3 className="font-semibold text-foreground/80 text-sm uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {loading ? (
        <div className="h-9 w-24 bg-foreground/10 animate-pulse rounded-lg mt-2" />
      ) : (
        <div className="mt-2 flex items-end justify-between">
          <div className="text-3xl font-display font-bold">{value}</div>

          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center font-bold text-sm px-2 py-1 rounded-full border-2",
                trendIsGood
                  ? "bg-green-100 text-green-700 border-green-700/20"
                  : "bg-red-100 text-red-700 border-red-700/20",
              )}
            >
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : trend < 0 ? (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              ) : null}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
