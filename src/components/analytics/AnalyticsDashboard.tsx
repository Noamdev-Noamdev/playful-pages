import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Download,
  AlertTriangle,
  Database,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyticsQuery, useAnalyticsExport } from "@/hooks/useAnalytics";
import { StatCard } from "./StatCard";
import { DateRangePicker } from "./DateRangePicker";
import { AnalyticsTable, Column } from "./AnalyticsTable";
import { DeviceChart } from "./DeviceChart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0m 0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

function safeNumber(val: any): string {
  if (val == null || isNaN(Number(val))) return "0";
  return new Intl.NumberFormat().format(Number(val));
}

function safeDate(dateStr: any, pattern: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return format(d, pattern);
  } catch {
    return String(dateStr);
  }
}

function getCountryFlag(countryCode: string) {
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) return "🌐";
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

export function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [dateRange, setDateRange] = useState({ from: today, to: today });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("pages");

  const refetchInterval = autoRefresh ? 10000 : undefined;

  const summaryQuery = useAnalyticsQuery<any>("summary", dateRange, { refetchInterval });
  const timeseriesQuery = useAnalyticsQuery<any>("timeseries", dateRange, { refetchInterval });
  const tabQuery = useAnalyticsQuery<any>(activeTab as any, dateRange, { refetchInterval });

  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = summaryQuery;
  const { data: timeseries, isLoading: isLoadingTimeseries, error: timeseriesError } = timeseriesQuery;
  const { data: tabData, isLoading: isLoadingTabData, error: tabError } = tabQuery;

  const exportData = useAnalyticsExport(dateRange);

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const handleExport = async () => {
    try {
      await exportData();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const currentError = summaryError || timeseriesError || tabError;
  const isFetching = summaryQuery.isFetching || timeseriesQuery.isFetching || tabQuery.isFetching;
  const isDbMissing = (currentError as Error)?.message?.toLowerCase().includes("database error") ||
    (currentError as Error)?.message?.toLowerCase().includes("500");

  const pagesColumns: Column<any>[] = [
    { key: "path", label: "Path", sortable: true, format: (v) => v || "/" },
    {
      key: "visitors",
      label: "Visitors",
      sortable: true,
      align: "right",
      format: (v) => safeNumber(v),
    },
    {
      key: "pageviews",
      label: "Pageviews",
      sortable: true,
      align: "right",
      format: (v) => safeNumber(v),
    },
    {
      key: "avgTime",
      label: "Avg Time",
      sortable: true,
      align: "right",
      format: (v) => formatTime(v),
    },
  ];

  const referrersColumns: Column<any>[] = [
    { key: "domain", label: "Domain", sortable: true, format: (v) => v || "Direct / None" },
    {
      key: "visitors",
      label: "Visitors",
      sortable: true,
      align: "right",
      format: (v) => safeNumber(v),
    },
    {
      key: "percentage",
      label: "% of Total",
      sortable: true,
      align: "right",
      format: (v) => {
        const pct = Math.min(100, Math.max(0, Number(v) || 0));
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="w-12 text-right font-mono">{pct.toFixed(1)}%</span>
            <div className="w-16 h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
  ];

  const countriesColumns: Column<any>[] = [
    {
      key: "country",
      label: "Country",
      sortable: true,
      format: (v) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCountryFlag(v)}</span> {v || "Unknown"}
        </div>
      ),
    },
    {
      key: "visitors",
      label: "Visitors",
      sortable: true,
      align: "right",
      format: (v) => safeNumber(v),
    },
    {
      key: "percentage",
      label: "% of Total",
      sortable: true,
      align: "right",
      format: (v) => {
        const pct = Math.min(100, Math.max(0, Number(v) || 0));
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="w-12 text-right font-mono">{pct.toFixed(1)}%</span>
            <div className="w-16 h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
  ];

  const citiesColumns: Column<any>[] = [
    { key: "city", label: "City", sortable: true, format: (v) => v || "Unknown" },
    { key: "country", label: "Country", sortable: true, format: (v) => v || "Unknown" },
    {
      key: "visitors",
      label: "Visitors",
      sortable: true,
      align: "right",
      format: (v) => safeNumber(v),
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display font-bold text-lg hover:underline decoration-2 underline-offset-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to site
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
            <Button
              onClick={refreshAll}
              variant="outline"
              className="border-2 border-foreground rounded-xl shadow-[2px_2px_0_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all font-bold"
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Refreshing..." : "Refresh now"}
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-2 border-foreground rounded-xl shadow-[2px_2px_0_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <label className="flex items-center gap-2 font-bold cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-foreground checked:bg-foreground accent-foreground"
              />
              Auto-refresh
            </label>
          </div>
        </div>

        {/* Database Migration Alert if tables aren't created yet */}
        {isDbMissing && (
          <div className="border-2 border-foreground rounded-2xl p-5 bg-card-yellow shadow-[4px_4px_0_0_var(--foreground)]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-background rounded-xl border-2 border-foreground">
                <Database className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  Database Table Setup Needed
                </h3>
                <p className="mt-1 text-sm font-medium text-foreground/90">
                  The analytics table standard query failed (likely because the <code className="bg-background/60 px-1.5 py-0.5 rounded border border-foreground font-mono text-xs">analytics_events</code> table has not been created in Supabase yet).
                </p>
                <p className="mt-2 text-xs font-bold text-foreground">
                  Solution: Open the Supabase SQL Editor for your project and execute the SQL script in <code className="bg-background/60 px-1.5 py-0.5 rounded border border-foreground font-mono">analytics-schema.sql</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error Notice */}
        {currentError && !isDbMissing && (
          <div className="border-2 border-foreground rounded-2xl p-4 bg-destructive/10 text-destructive shadow-[4px_4px_0_0_var(--foreground)] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">
              {(currentError as Error).message || "Failed to load some analytics data."}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Visitors"
            value={safeNumber(summary?.visitors)}
            icon={<Users className="w-5 h-5" />}
            trend={summary?.visitorsTrend}
            color="bg-card-pink"
            loading={isLoadingSummary}
          />
          <StatCard
            title="Pageviews"
            value={safeNumber(summary?.pageviews)}
            icon={<Eye className="w-5 h-5" />}
            trend={summary?.pageviewsTrend}
            color="bg-card-yellow"
            loading={isLoadingSummary}
          />
          <StatCard
            title="Bounce Rate"
            value={summary?.bounceRate != null ? `${Number(summary.bounceRate).toFixed(1)}%` : "0.0%"}
            icon={<MousePointerClick className="w-5 h-5" />}
            trend={summary?.bounceRateTrend}
            trendInverted
            color="bg-card-mint"
            loading={isLoadingSummary}
          />
          <StatCard
            title="Avg Duration"
            value={formatTime(summary?.avgSessionDuration)}
            icon={<Clock className="w-5 h-5" />}
            trend={summary?.durationTrend}
            color="bg-card-sky"
            loading={isLoadingSummary}
          />
        </div>

        {/* Timeseries Chart */}
        <div className="border-2 border-foreground rounded-3xl p-4 sm:p-6 shadow-[6px_6px_0_0_var(--foreground)] bg-background">
          <h2 className="text-xl font-display font-bold mb-6">Traffic Overview</h2>
          <div className="h-[350px] w-full">
            {isLoadingTimeseries ? (
              <div className="w-full h-full animate-pulse bg-foreground/5 rounded-2xl"></div>
            ) : timeseries && Array.isArray(timeseries) && timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.86 0.1 230)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="oklch(0.86 0.1 230)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.92 0.14 95)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="oklch(0.92 0.14 95)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(tick) => safeDate(tick, "MMM d")}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "currentColor", fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "currentColor", fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(tick) => (tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "2px solid var(--color-foreground)",
                      boxShadow: "4px 4px 0 0 var(--color-foreground)",
                      fontWeight: "bold",
                    }}
                    labelFormatter={(label) => safeDate(label, "MMM d, yyyy")}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    stroke="oklch(0.92 0.14 95)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPageviews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="oklch(0.86 0.1 230)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground font-medium gap-2">
                <p className="font-bold text-base">No traffic data for this period</p>
                <p className="text-xs">Data will populate automatically as users visit pages on your site.</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Tabs */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-4 mb-2 scrollbar-none">
              <TabsList className="h-auto p-1 bg-muted/50 border-2 border-foreground/10 rounded-2xl inline-flex w-max">
                {["pages", "referrers", "countries", "cities", "devices", "browsers", "os"].map(
                  (tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="capitalize text-base font-bold rounded-xl px-4 py-2 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                    >
                      {tab}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </div>

            <TabsContent value="pages" className="mt-0 focus-visible:outline-none">
              <AnalyticsTable
                columns={pagesColumns}
                data={Array.isArray(tabData) ? tabData : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="referrers" className="mt-0 focus-visible:outline-none">
              <AnalyticsTable
                columns={referrersColumns}
                data={Array.isArray(tabData) ? tabData : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="countries" className="mt-0 focus-visible:outline-none">
              <AnalyticsTable
                columns={countriesColumns}
                data={Array.isArray(tabData) ? tabData : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="cities" className="mt-0 focus-visible:outline-none">
              <AnalyticsTable
                columns={citiesColumns}
                data={Array.isArray(tabData) ? tabData : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="devices" className="mt-0 focus-visible:outline-none">
              <DeviceChart
                data={Array.isArray(tabData) ? tabData.map((d: any) => ({
                  name: d?.deviceType || "desktop",
                  visitors: Number(d?.visitors) || 0,
                  percentage: Math.round((Number(d?.percentage) || 0) * 10) / 10,
                })) : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="browsers" className="mt-0 focus-visible:outline-none">
              <DeviceChart
                data={Array.isArray(tabData) ? tabData.map((d: any) => ({
                  name: d?.browser || "Other",
                  visitors: Number(d?.visitors) || 0,
                  percentage: Math.round((Number(d?.percentage) || 0) * 10) / 10,
                })) : []}
                loading={isLoadingTabData}
              />
            </TabsContent>

            <TabsContent value="os" className="mt-0 focus-visible:outline-none">
              <DeviceChart
                data={Array.isArray(tabData) ? tabData.map((d: any) => ({
                  name: d?.os || "Other",
                  visitors: Number(d?.visitors) || 0,
                  percentage: Math.round((Number(d?.percentage) || 0) * 10) / 10,
                })) : []}
                loading={isLoadingTabData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
