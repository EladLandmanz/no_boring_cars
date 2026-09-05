import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type NotificationRow = {
  id: string;
  kind: string;
  listing_id: string | null;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

export async function listMyNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, listing_id, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function countUnreadNotifications(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function insertNotification(row: {
  user_id: string;
  kind: "won" | "review" | "sold";
  listing_id: string;
  title: string;
  body: string;
  href: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert(row);
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export async function insertReviewNotifications(listing: {
  id: string;
  slug: string;
  headline: string;
}) {
  const supabase = createAdminClient();
  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) {
    throw new Error(error.message);
  }

  for (const admin of admins ?? []) {
    await insertNotification({
      user_id: admin.id,
      kind: "review",
      listing_id: listing.id,
      title: "Listing awaiting review",
      body: listing.headline,
      href: "/admin",
    });
  }
}
