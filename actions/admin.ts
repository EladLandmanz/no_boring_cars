"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

const CANCELLABLE = ["draft", "pending_review", "upcoming", "live"] as const;

async function requireAdmin() {
  const ctx = await getAuthContext();
  if (!ctx.user) {
    redirect("/login?next=/admin");
  }
  if (ctx.profile?.role !== "admin") {
    redirect("/");
  }
  return ctx;
}

export async function cancelListing(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, status")
    .eq("id", id)
    .maybeSingle();

  if (!listing || !(CANCELLABLE as readonly string[]).includes(listing.status)) {
    redirect("/admin");
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/auctions");
  revalidatePath("/account");
  if (listing.slug) {
    revalidatePath(`/auctions/${listing.slug}`);
  }
  redirect("/admin");
}
