import { createFileRoute } from "@tanstack/react-router";
import type { } from "@tanstack/react-start";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getEnv, verifyAdmin } from "@/lib/server-analytics";

export const Route = createFileRoute("/api/analytics/query")({
  server: {
    handlers: {
      GET: async ({ request, context }: { request: Request; context?: any }) => {
        try {
          try {
            await verifyAdmin(request, context);
          } catch (e: any) {
            const msg = (e?.message ?? "401") as string;
            if (msg.startsWith("401"))
              return new Response(msg, { status: 401, headers: { "Content-Type": "text/plain" } });
            if (msg.startsWith("403"))
              return new Response(msg, { status: 403, headers: { "Content-Type": "text/plain" } });
            throw e;
          }

          const url = new URL(request.url);
          const metric = url.searchParams.get("metric");
          let from = url.searchParams.get("from");
          let to = url.searchParams.get("to");

          if (!from) {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            from = d.toISOString();
          }
          if (!to) {
            to = new Date().toISOString();
          }

          // Normalize from/to to ISO strings:
          // - If passed as bare YYYY-MM-DD, expand to start-of-day / end-of-day
          //   (otherwise lte("created_at", "2026-08-25") misses the whole day
          //    because Postgres coerces it to 2026-08-25 00:00:00 UTC)
          function toStartOfDayIso(s: string): string {
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00.000Z`;
            return s;
          }
          function toEndOfDayIso(s: string): string {
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T23:59:59.999Z`;
            return s;
          }
          const fromIso = toStartOfDayIso(from);
          const toIso = toEndOfDayIso(to);

          const env = getEnv(request, context);
          const supabase = createSupabaseAdmin(env);

          const { data: events, error } = await supabase
            .from("analytics_events")
            .select("*")
            .gte("created_at", from)
            .lte("created_at", to);

          if (error) {
            console.error("[analytics] Supabase error:", error);
            return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
          }

          if (!events) return new Response(JSON.stringify([]));

          const totalVisitors = new Set(events.map((e) => e.visitor_id)).size;

          switch (metric) {
            case "summary": {
              const pageviews = events.length;
              const entryEvents = events.filter((e) => e.is_entry);
              const bounces = entryEvents.filter((e) => e.is_bounce).length;
              const bounceRate = entryEvents.length > 0 ? (bounces / entryEvents.length) * 100 : 0;

              const sessions = new Map<string, number>();
              events.forEach((e) => {
                const currentMax = sessions.get(e.session_id) || 0;
                if (e.time_on_page > currentMax) {
                  sessions.set(e.session_id, e.time_on_page);
                }
              });

              let avgSessionDuration = 0;
              if (sessions.size > 0) {
                const totalDuration = Array.from(sessions.values()).reduce((a, b) => a + b, 0);
                avgSessionDuration = totalDuration / sessions.size;
              }

              // Calculate previous period for trend comparison
              const fromDate = new Date(fromIso);
              const toDate = new Date(toIso);
              const periodMs = toDate.getTime() - fromDate.getTime();
              const prevFrom = new Date(fromDate.getTime() - periodMs).toISOString();
              const prevTo = fromDate.toISOString();

              const { data: prevEvents } = await supabase
                .from("analytics_events")
                .select("*")
                .gte("created_at", prevFrom)
                .lte("created_at", prevTo);

              let visitorsTrend = 0;
              let pageviewsTrend = 0;
              let bounceRateTrend = 0;
              let durationTrend = 0;

              if (prevEvents && prevEvents.length > 0) {
                const prevVisitors = new Set(prevEvents.map((e) => e.visitor_id)).size;
                const prevPageviews = prevEvents.length;
                const prevEntryEvents = prevEvents.filter((e) => e.is_entry);
                const prevBounces = prevEntryEvents.filter((e) => e.is_bounce).length;
                const prevBounceRate =
                  prevEntryEvents.length > 0 ? (prevBounces / prevEntryEvents.length) * 100 : 0;

                const prevSessions = new Map<string, number>();
                prevEvents.forEach((e) => {
                  const currentMax = prevSessions.get(e.session_id) || 0;
                  if (e.time_on_page > currentMax) {
                    prevSessions.set(e.session_id, e.time_on_page);
                  }
                });
                let prevAvgDuration = 0;
                if (prevSessions.size > 0) {
                  prevAvgDuration =
                    Array.from(prevSessions.values()).reduce((a, b) => a + b, 0) / prevSessions.size;
                }

                visitorsTrend =
                  prevVisitors > 0 ? ((totalVisitors - prevVisitors) / prevVisitors) * 100 : 0;
                pageviewsTrend =
                  prevPageviews > 0 ? ((pageviews - prevPageviews) / prevPageviews) * 100 : 0;
                bounceRateTrend =
                  prevBounceRate > 0 ? ((bounceRate - prevBounceRate) / prevBounceRate) * 100 : 0;
                durationTrend =
                  prevAvgDuration > 0
                    ? ((avgSessionDuration - prevAvgDuration) / prevAvgDuration) * 100
                    : 0;
              }

              return new Response(
                JSON.stringify({
                  visitors: totalVisitors,
                  pageviews,
                  bounceRate: Math.round(bounceRate * 10) / 10,
                  avgSessionDuration: Math.round(avgSessionDuration),
                  visitorsTrend: Math.round(visitorsTrend * 10) / 10,
                  pageviewsTrend: Math.round(pageviewsTrend * 10) / 10,
                  bounceRateTrend: Math.round(bounceRateTrend * 10) / 10,
                  durationTrend: Math.round(durationTrend * 10) / 10,
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }

            case "timeseries": {
              const daily = new Map<string, { visitors: Set<string>; pageviews: number }>();
              events.forEach((e) => {
                const date = e.created_at.split("T")[0];
                if (!daily.has(date)) daily.set(date, { visitors: new Set(), pageviews: 0 });
                const d = daily.get(date)!;
                d.visitors.add(e.visitor_id);
                d.pageviews++;
              });

              // Backfill missing days with zeros so recharts Area renders a
              // continuous filled area instead of isolated dots.
              function formatYmd(d: Date): string {
                const y = d.getUTCFullYear();
                const m = String(d.getUTCMonth() + 1).padStart(2, "0");
                const day = String(d.getUTCDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
              }
              const start = new Date(fromIso);
              const end = new Date(toIso);
              const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
              const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
              while (cursor.getTime() <= endUtc) {
                const key = formatYmd(cursor);
                if (!daily.has(key)) daily.set(key, { visitors: new Set(), pageviews: 0 });
                cursor.setUTCDate(cursor.getUTCDate() + 1);
              }

              const result = Array.from(daily.entries())
                .map(([date, data]) => ({
                  date,
                  visitors: data.visitors.size,
                  pageviews: data.pageviews,
                }))
                .sort((a, b) => a.date.localeCompare(b.date));
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "pages": {
              const pages = new Map<
                string,
                { visitors: Set<string>; pageviews: number; timeTotal: number; timeCount: number }
              >();
              events.forEach((e) => {
                if (!pages.has(e.page_path))
                  pages.set(e.page_path, {
                    visitors: new Set(),
                    pageviews: 0,
                    timeTotal: 0,
                    timeCount: 0,
                  });
                const p = pages.get(e.page_path)!;
                p.visitors.add(e.visitor_id);
                p.pageviews++;
                if (e.time_on_page > 0) {
                  p.timeTotal += e.time_on_page;
                  p.timeCount++;
                }
              });
              const result = Array.from(pages.entries())
                .map(([path, p]) => ({
                  path,
                  visitors: p.visitors.size,
                  pageviews: p.pageviews,
                  avgTime: p.timeCount > 0 ? p.timeTotal / p.timeCount : 0,
                }))
                .sort((a, b) => b.pageviews - a.pageviews)
                .slice(0, 100);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "referrers": {
              const refs = new Map<string, Set<string>>();
              events.forEach((e) => {
                if (e.referrer_domain) {
                  if (!refs.has(e.referrer_domain)) refs.set(e.referrer_domain, new Set());
                  refs.get(e.referrer_domain)!.add(e.visitor_id);
                }
              });
              const result = Array.from(refs.entries())
                .map(([domain, visitorsSet]) => ({
                  domain,
                  visitors: visitorsSet.size,
                  percentage:
                    totalVisitors > 0
                      ? Math.round((visitorsSet.size / totalVisitors) * 1000) / 10
                      : 0,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 50);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "countries": {
              const countries = new Map<string, Set<string>>();
              events.forEach((e) => {
                if (e.country) {
                  if (!countries.has(e.country)) countries.set(e.country, new Set());
                  countries.get(e.country)!.add(e.visitor_id);
                }
              });
              const result = Array.from(countries.entries())
                .map(([country, vSet]) => ({
                  country,
                  visitors: vSet.size,
                  percentage: totalVisitors > 0 ? (vSet.size / totalVisitors) * 100 : 0,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 50);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "cities": {
              const cities = new Map<string, { country: string; visitors: Set<string> }>();
              events.forEach((e) => {
                if (e.city) {
                  const key = `${e.city}|${e.country}`;
                  if (!cities.has(key)) cities.set(key, { country: e.country, visitors: new Set() });
                  cities.get(key)!.visitors.add(e.visitor_id);
                }
              });
              const result = Array.from(cities.entries())
                .map(([key, data]) => ({
                  city: key.split("|")[0],
                  country: data.country,
                  visitors: data.visitors.size,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 50);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "browsers": {
              const browsers = new Map<string, Set<string>>();
              events.forEach((e) => {
                const b = e.browser || "Unknown";
                if (!browsers.has(b)) browsers.set(b, new Set());
                browsers.get(b)!.add(e.visitor_id);
              });
              const result = Array.from(browsers.entries())
                .map(([browser, vSet]) => ({
                  browser,
                  visitors: vSet.size,
                  percentage: totalVisitors > 0 ? (vSet.size / totalVisitors) * 100 : 0,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 20);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "devices": {
              const devices = new Map<string, Set<string>>();
              events.forEach((e) => {
                const d = e.device_type || "Unknown";
                if (!devices.has(d)) devices.set(d, new Set());
                devices.get(d)!.add(e.visitor_id);
              });
              const result = Array.from(devices.entries())
                .map(([deviceType, vSet]) => ({
                  deviceType,
                  visitors: vSet.size,
                  percentage: totalVisitors > 0 ? (vSet.size / totalVisitors) * 100 : 0,
                }))
                .sort((a, b) => b.visitors - a.visitors);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            case "os": {
              const osMap = new Map<string, Set<string>>();
              events.forEach((e) => {
                const o = e.os || "Unknown";
                if (!osMap.has(o)) osMap.set(o, new Set());
                osMap.get(o)!.add(e.visitor_id);
              });
              const result = Array.from(osMap.entries())
                .map(([os, vSet]) => ({
                  os,
                  visitors: vSet.size,
                  percentage: totalVisitors > 0 ? (vSet.size / totalVisitors) * 100 : 0,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 20);
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            }

            default:
              return new Response(JSON.stringify({ error: "Invalid metric" }), { status: 400 });
          }
        } catch (error) {
          console.error("[analytics] error in query:", error);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
      },
    },
  },
});
