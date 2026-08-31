/**
 * Public env the browser is allowed to see (NEXT_PUBLIC_*).
 * The URL must be the project origin. The JS client appends /auth/v1 and /rest/v1 itself.
 */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (url.includes("/rest/") || url.includes("/auth/")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be https://<ref>.supabase.co with no /rest/v1 path",
    );
  }

  return { url, key };
}
