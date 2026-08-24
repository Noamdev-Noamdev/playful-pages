import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getEnv, verifyAdmin } from "@/lib/server-analytics";

export const Route = createFileRoute("/api/analytics/cleanup")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context?: any }) => {
        try {
          try {
            await verifyAdmin(request, context);
          } catch (e: any) {
            if (e.message === "401") return new Response("Unauthorized", { status: 401 });
            if (e.message === "403") return new Response("Forbidden", { status: 403 });
            throw e;
          }

          const env = getEnv(request, context);
          const supabase = createSupabaseAdmin(env);

          const d12MonthsAgo = new Date();
          d12MonthsAgo.setMonth(d12MonthsAgo.getMonth() - 12);
          const date12MonthsAgoStr = d12MonthsAgo.toISOString();

          const d2DaysAgo = new Date();
          d2DaysAgo.setDate(d2DaysAgo.getDate() - 2);
          const date2DaysAgoStr = d2DaysAgo.toISOString().split("T")[0];

          const { error: eventsError, count: eventsDeleted } = await supabase
            .from("analytics_events")
            .delete({ count: "exact" })
            .lt("created_at", date12MonthsAgoStr);

          if (eventsError) {
            console.error("[analytics] Cleanup events error:", eventsError);
          }

          const { error: saltsError, count: saltsDeleted } = await supabase
            .from("analytics_salts")
            .delete({ count: "exact" })
            .lt("date", date2DaysAgoStr);

          if (saltsError) {
            console.error("[analytics] Cleanup salts error:", saltsError);
          }

          return new Response(
            JSON.stringify({
              success: true,
              deletedEvents: eventsDeleted || 0,
              deletedSalts: saltsDeleted || 0,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("[analytics] error in cleanup:", error);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
      },
    },
  },
});
