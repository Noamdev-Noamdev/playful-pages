import { createSupabaseAdmin } from "./supabase-admin";
import { createClient } from "@supabase/supabase-js";

export function getEnv(request: Request, context?: any): Record<string, string | undefined> {
  return {
    ...((globalThis as any).process?.env ?? {}),
    ...(context?.cloudflare?.env ?? {}),
    ...((request as any)?.env ?? {}),
  };
}

export async function hashVisitorId(ip: string, userAgent: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}${userAgent}${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.slice(0, 16);
}

export async function getOrCreateDailySalt(supabase: any, date: string): Promise<string> {
  const { data } = await supabase
    .from("analytics_salts")
    .select("salt")
    .eq("date", date)
    .single();

  if (data?.salt) {
    return data.salt;
  }

  const newSalt = crypto.randomUUID();
  await supabase.from("analytics_salts").insert({ date, salt: newSalt }).select().single();

  return newSalt;
}

export function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  let browser = "Other";
  let os = "Other";
  let deviceType = "desktop";

  if (!ua) return { browser, os, deviceType };

  if (/Mobile|Android.*Mobile|iPhone/i.test(ua)) deviceType = "mobile";
  else if (/iPad|Android(?!.*Mobile)/i.test(ua)) deviceType = "tablet";

  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

  if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Edge|Edg/i.test(ua)) browser = "Edge";
  else if (/OPR|Opera/i.test(ua)) browser = "Opera";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Chrome|CriOS/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = "Safari";

  return { browser, os, deviceType };
}

export function extractDomain(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

export async function verifyAdmin(request: Request, context?: any): Promise<{ userId: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("401");
  }

  const token = authHeader.substring(7);
  const env = getEnv(request, context);
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error("[verifyAdmin] Missing SUPABASE_URL / VITE_SUPABASE_URL in env");
    throw new Error("401");
  }

  let userId: string | null = null;
  try {
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "",
      },
    });
    if (userRes.ok) {
      const body = await userRes.json();
      userId = body?.id ?? null;
    }
  } catch (e) {
    console.error("[verifyAdmin] fetch auth/v1/user failed:", e);
  }

  if (!userId) {
    throw new Error("401");
  }

  const supabase = createSupabaseAdmin(env);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new Error("403");
  }

  return { userId };
}

export async function getSessionId(visitorId: string, timestamp: Date): Promise<string> {
  const thirtyMins = 30 * 60 * 1000;
  const timeBucket = Math.floor(timestamp.getTime() / thirtyMins);
  const data = new TextEncoder().encode(`${visitorId}${timeBucket}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.slice(0, 16);
}
