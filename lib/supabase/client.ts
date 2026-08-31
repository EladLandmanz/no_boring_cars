import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Browser-only. Uses a singleton internally — safe to call from Client Components. */
export function createClient() {
  const { url, key } = getSupabasePublicEnv();
  return createBrowserClient(url, key);
}
