import { createFileRoute } from "@tanstack/react-router";
import type { } from "@tanstack/react-start";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getEnv, verifyAdmin } from "@/lib/server-analytics";

export const Route = createFileRoute("/api/analytics/export")({
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
            .gte("created_at", fromIso)
            .lte("created_at", toIso)
            .order("created_at", { ascending: true });

          if (error) {
            console.error("[analytics] Supabase error in export:", error);
            return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
          }

          const headers = [
            "created_at",
            "page_path",
            "visitor_id",
            "session_id",
            "referrer_domain",
            "device_type",
            "browser",
            "os",
            "country",
            "city",
            "time_on_page",
            "is_bounce",
          ];

          let csvContent = headers.join(",") + "\n";

          if (events) {
            events.forEach((e) => {
              const row = [
                e.created_at,
                `"${e.page_path.replace(/"/g, '""')}"`,
                e.visitor_id,
                e.session_id,
                `"${(e.referrer_domain || "").replace(/"/g, '""')}"`,
                e.device_type,
                e.browser,
                e.os,
                `"${(e.country || "").replace(/"/g, '""')}"`,
                `"${(e.city || "").replace(/"/g, '""')}"`,
                e.time_on_page,
                e.is_bounce,
              ];
              csvContent += row.join(",") + "\n";
            });
          }

          return new Response(csvContent, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="analytics_export_${from.split("T")[0]}_${to.split("T")[0]}.csv"`,
            },
          });
        } catch (error) {
          console.error("[analytics] error in export:", error);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
      },
    },
  },
});
