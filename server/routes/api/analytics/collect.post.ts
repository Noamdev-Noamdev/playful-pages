import { defineEventHandler, readBody } from "vinxi/http";
import { createSupabaseAdmin } from "../../../utils/supabase-admin";
import {
  hashVisitorId,
  getOrCreateDailySalt,
  parseUserAgent,
  extractDomain,
  getSessionId,
} from "../../../utils/analytics";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body || !body.url) {
      return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });
    }

    const { url, referrer, screenWidth, timeOnPage } = body;
    const cappedTimeOnPage = timeOnPage ? Math.min(timeOnPage, 3600) : 0;

    const env = (event.context as any).cloudflare?.env ?? process.env;
    const supabase = createSupabaseAdmin(env);

    const ip =
      event.headers?.get?.("cf-connecting-ip") ||
      event.headers?.get?.("x-forwarded-for") ||
      event.headers?.get?.("x-real-ip") ||
      event.node?.req?.headers?.["x-forwarded-for"] ||
      event.node?.req?.headers?.["x-real-ip"] ||
      "unknown";

    const userAgent =
      event.headers?.get?.("user-agent") || event.node?.req?.headers?.["user-agent"] || "";

    const cf = (event.context as any).cloudflare?.cf || {};
    const country = cf.country || "";
    const city = cf.city || "";
    const region = cf.regionCode || "";

    let pagePath = "";
    let hostname = "";
    try {
      const parsedUrl = new URL(url);
      pagePath = parsedUrl.pathname;
      hostname = parsedUrl.hostname;
    } catch (e) {
      // ignore invalid url
    }

    const today = new Date().toISOString().split("T")[0];
    const salt = await getOrCreateDailySalt(supabase, today);
    const visitorId = await hashVisitorId(ip as string, userAgent as string, salt);

    const now = new Date();
    const sessionId = await getSessionId(visitorId, now);

    const { browser, os, deviceType } = parseUserAgent(userAgent as string);
    const referrerDomain = extractDomain(referrer);

    // If timeOnPage is provided and > 0, update the previous pageview (beacon update)
    if (cappedTimeOnPage > 0) {
      const { data: latestEvent } = await supabase
        .from("analytics_events")
        .select("id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestEvent) {
        await supabase
          .from("analytics_events")
          .update({ time_on_page: cappedTimeOnPage })
          .eq("id", latestEvent.id);
      }
      return new Response(null, { status: 204 });
    }

    // Check if this is the first pageview in the session
    const { data: previousEvents } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("session_id", sessionId)
      .limit(1);

    const isEntry = !previousEvents || previousEvents.length === 0;

    // If not an entry, update the previous event's is_bounce to false
    if (!isEntry) {
      const { data: latestEvent } = await supabase
        .from("analytics_events")
        .select("id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestEvent) {
        await supabase
          .from("analytics_events")
          .update({ is_bounce: false })
          .eq("id", latestEvent.id);
      }
    }

    await supabase.from("analytics_events").insert({
      visitor_id: visitorId,
      session_id: sessionId,
      page_url: url,
      page_path: pagePath,
      hostname,
      referrer: referrer || "",
      referrer_domain: referrerDomain,
      device_type: deviceType,
      browser,
      os,
      country,
      city,
      region,
      screen_width: screenWidth || 0,
      is_entry: isEntry,
      is_bounce: true,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[analytics] error in collect:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
