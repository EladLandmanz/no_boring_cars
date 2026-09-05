"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/session";

export async function markNotificationRead(formData: FormData) {
  const { user, supabase } = await getAuthContext();
  if (!user) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
  revalidatePath("/account");
}

export async function markAllNotificationsRead() {
  const { user, supabase } = await getAuthContext();
  if (!user) {
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
  revalidatePath("/account");
}
