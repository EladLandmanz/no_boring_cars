import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  has_chosen_username: boolean;
  role: string;
};

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, has_chosen_username, role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null, supabase };
}

/** Open redirects: only allow same-origin relative paths. */
export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
