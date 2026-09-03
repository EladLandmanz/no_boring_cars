"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PUBLIC_LISTING_STATUSES } from "@/lib/listings/types";

export async function toggleWatch(formData: FormData) {
  const { user, profile, supabase } = await getAuthContext();
  const listingId = String(formData.get("listing_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const next = slug ? `/auctions/${slug}` : "/auctions";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (!profile?.has_chosen_username) {
    redirect("/account/username");
  }
  if (!listingId) {
    redirect(next);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, seller_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (
    !listing ||
    listing.seller_id === user.id ||
    !(PUBLIC_LISTING_STATUSES as readonly string[]).includes(listing.status)
  ) {
    redirect(next);
  }

  const { data: existing } = await supabase
    .from("watches")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("watches")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
  } else {
    await supabase.from("watches").insert({
      user_id: user.id,
      listing_id: listingId,
    });
  }

  revalidatePath(next);
  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/auctions");
}
