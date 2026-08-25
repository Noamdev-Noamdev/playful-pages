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
  try {
    // First try the cached session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Check if token is close to expiry (within 60 seconds)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt - now < 60) {
        console.log("[analytics] Token expiring soon, refreshing...");
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session?.access_token) {
          return refreshData.session.access_token;
        }
      }
      return session.access_token;
    }

    // No cached session — try refreshing
    console.log("[analytics] No cached session, attempting refresh...");
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("[analytics] Session refresh failed:", refreshError.message);
      return undefined;
    }
    return refreshData.session?.access_token;
  } catch (err) {
    console.error("[analytics] getValidToken error:", err);
    return undefined;
  }
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

      if (!token) {
        throw new Error(
          "Not authenticated. Please sign out and sign back in.",
        );
      }

      const params = new URLSearchParams({
        metric,
        from: dateRange.from,
        to: dateRange.to,
      });

      const res = await fetch(`/api/analytics/query?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Read the response body as text first (can only be consumed once)
        const responseText = await res.text();
        let errorMsg: string;

        if (res.status === 401) {
          errorMsg = "Session expired. Please sign out and sign back in.";
        } else if (res.status === 403) {
          errorMsg = "Access denied. Your account does not have admin privileges.";
        } else {
          // Try to parse as JSON for structured error
          try {
            const body = JSON.parse(responseText);
            errorMsg = body?.error || `Error ${res.status}: ${responseText}`;
          } catch {
            errorMsg = `Error ${res.status}: ${responseText || "Failed to fetch analytics data"}`;
          }
        }
        throw new Error(errorMsg);
      }
      return res.json();
    },
    refetchInterval: options?.refetchInterval,
    throwOnError: false,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (
        error?.message?.includes("401") ||
        error?.message?.includes("403") ||
        error?.message?.includes("Not authenticated") ||
        error?.message?.includes("Session expired")
      ) {
        return false;
      }
      return failureCount < 1;
    },
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
