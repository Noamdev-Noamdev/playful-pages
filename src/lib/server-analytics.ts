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

export async function verifyAdmin(
  request: Request,
  context?: any,
): Promise<{ userId: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("[verifyAdmin] Missing or malformed Authorization header");
    throw new Error("401:no_auth_header");
  }

  const token = authHeader.substring(7);
  if (token.length < 20) {
    console.error("[verifyAdmin] Bearer token suspiciously short");
    throw new Error("401:bad_token_length");
  }

  const env = getEnv(request, context);
  const supabaseUrl = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const anonKey = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl) {
    console.error("[verifyAdmin] SUPABASE_URL/VITE_SUPABASE_URL missing in env. Keys present?", {
      hasAnon: !!anonKey,
      hasService: !!serviceKey,
    });
    throw new Error("401:missing_supabase_url");
  }
  if (!anonKey) console.warn("[verifyAdmin] anon key missing, strategy 1/3 may fail");
  if (!serviceKey) console.warn("[verifyAdmin] service role key missing, profile check will fail");

  let userId: string | null = null;
  const errors: string[] = [];

  // Strategy 1: Anon supabase-js client.getUser()
  if (anonKey && !userId) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await anonClient.auth.getUser(token);
      if (!error && data?.user?.id) {
        userId = data.user.id;
        console.log("[verifyAdmin] Strategy 1 (anon getUser) succeeded");
      } else if (error) {
        errors.push(`anon_getUser:${error.name}:${error.message}`);
      }
    } catch (e: any) {
      errors.push(`anon_getUser_throw:${e?.message ?? String(e)}`);
    }
  } else if (!anonKey) {
    errors.push("anon_getUser:skipped_no_anon_key");
  }

  // Strategy 2: Direct fetch to /auth/v1/user (low-level, SDK-independent)
  if (!userId) {
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey || serviceKey,
        },
        cf: { cacheTtl: 0 },
      } as any);
      if (userRes.ok) {
        const body = await userRes.json();
        if (body?.id) {
          userId = body.id;
          console.log("[verifyAdmin] Strategy 2 (fetch /auth/v1/user) succeeded");
        } else {
          errors.push(`fetch_auth_user:no_id_in_body,status=${userRes.status}`);
        }
      } else {
        const t = await userRes.text().catch(() => "");
        errors.push(`fetch_auth_user:status=${userRes.status},body=${t.slice(0, 120)}`);
      }
    } catch (e: any) {
      errors.push(`fetch_auth_user_throw:${e?.message ?? String(e)}`);
    }
  }

  // Strategy 3: Admin client getUser() (last resort)
  if (serviceKey && !userId) {
    try {
      const adminClient = createSupabaseAdmin(env);
      const { data, error } = await adminClient.auth.getUser(token);
      if (!error && data?.user?.id) {
        userId = data.user.id;
        console.log("[verifyAdmin] Strategy 3 (admin getUser) succeeded");
      } else if (error) {
        errors.push(`admin_getUser:${error.name}:${error.message}`);
      }
    } catch (e: any) {
      errors.push(`admin_getUser_throw:${e?.message ?? String(e)}`);
    }
  } else if (!serviceKey) {
    errors.push("admin_getUser:skipped_no_service_key");
  }

  if (!userId) {
    console.error("[verifyAdmin] All JWT validation strategies failed:", errors.join(" | "));
    throw new Error(`401:jwt_invalid:${errors.slice(0, 2).join(" || ")}`);
  }

  const supabase = createSupabaseAdmin(env);
  let profile: any = null;
  let profileErr: string | null = null;
  try {
    const res = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
    profile = res.data;
    if (res.error) profileErr = `${res.error.code}:${res.error.message}`;
  } catch (e: any) {
    profileErr = `throw:${e?.message ?? String(e)}`;
  }

  if (profileErr) {
    console.error(`[verifyAdmin] Profile lookup failed for user ${userId}:`, profileErr);
    throw new Error(`403:profile_lookup:${profileErr}`);
  }
  if (!profile) {
    console.error(`[verifyAdmin] No profile row found for user ${userId}`);
    throw new Error("403:profile_missing");
  }
  if (profile.is_admin !== true) {
    console.error(`[verifyAdmin] User ${userId} is not admin. is_admin=`, profile.is_admin);
    throw new Error("403:not_admin");
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
