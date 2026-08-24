import { defineEventHandler, getQuery } from "vinxi/http";
import { createSupabaseAdmin } from "../../../utils/supabase-admin";
import { verifyAdmin } from "../../../utils/analytics";

export default defineEventHandler(async (event) => {
  try {
    try {
      await verifyAdmin(event);
    } catch (e: any) {
      if (e.message === "401") return new Response("Unauthorized", { status: 401 });
      if (e.message === "403") return new Response("Forbidden", { status: 403 });
      throw e;
    }

    const query = getQuery(event);
    let from = query.from as string;
    let to = query.to as string;

    if (!from) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      from = d.toISOString();
    }
    if (!to) {
      to = new Date().toISOString();
    }

    const env = (event.context as any).cloudflare?.env ?? process.env;
    const supabase = createSupabaseAdmin(env);

    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
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
});
