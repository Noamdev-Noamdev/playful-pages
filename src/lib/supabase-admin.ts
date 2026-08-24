import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client that uses the service role key.
 * This bypasses Row Level Security and should ONLY be used in
 * server-side code (API routes, webhooks).
 */
export function createSupabaseAdmin(env: Record<string, string | undefined>) {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in server environment",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
