import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type AnalyticsMetric =
  | "summary"
  | "timeseries"
  | "pages"
  | "referrers"
  | "countries"
  | "cities"
  | "browsers"
  | "devices"
  | "os";

export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;
}

export interface SummaryData {
  visitors: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  visitorsTrend: number; // % change
  pageviewsTrend: number;
  bounceRateTrend: number;
  durationTrend: number;
}

export interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface PageData {
  path: string;
  visitors: number;
  pageviews: number;
  avgTime: number;
}

export interface ReferrerData {
  domain: string;
  visitors: number;
  percentage: number;
}

export interface CountryData {
  country: string;
  visitors: number;
  percentage: number;
}

export interface CityData {
  city: string;
  country: string;
  visitors: number;
}

export interface BrowserData {
  browser: string;
  visitors: number;
  percentage: number;
}

export interface DeviceData {
  deviceType: string;
  visitors: number;
  percentage: number;
}

export interface OsData {
  os: string;
  visitors: number;
  percentage: number;
}

async function getValidToken(): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return session.access_token;
  }

  // Fallback: try refreshing the session if token is missing/expired
  const { data: refreshData } = await supabase.auth.refreshSession();
  return refreshData.session?.access_token;
}

export function useAnalyticsQuery<T>(
  metric: AnalyticsMetric,
  dateRange: DateRange,
  options?: { refetchInterval?: number },
) {
  return useQuery<T>({
    queryKey: ["analytics", metric, dateRange],
    queryFn: async () => {
      const token = await getValidToken();

      const params = new URLSearchParams({
        metric,
        from: dateRange.from,
        to: dateRange.to,
      });

      const res = await fetch(`/api/analytics/query?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: Failed to fetch analytics data`;
        try {
          const body = await res.json();
          if (body?.error) errorMsg = body.error;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    },
    refetchInterval: options?.refetchInterval,
    throwOnError: false,
    retry: 1,
  });
}

export function useAnalyticsExport(dateRange: DateRange) {
  return async () => {
    const token = await getValidToken();

    const params = new URLSearchParams({
      from: dateRange.from,
      to: dateRange.to,
    });

    const res = await fetch(`/api/analytics/export?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error("Failed to export data");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${dateRange.from}-to-${dateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}
