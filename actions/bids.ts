"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ilsToAgorot } from "@/lib/listings/format";
import { getAuthContext } from "@/lib/auth/session";
import { mapNbcError } from "@/lib/supabase/errors";

export type BidFormState = { error: string } | null;

export async function placeBid(
  _prev: BidFormState,
  formData: FormData,
): Promise<BidFormState> {
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
    return { error: "Missing listing." };
  }

  const amount = ilsToAgorot(String(formData.get("amount_ils") ?? ""));
  if (amount == null) {
    return { error: "Enter a bid in ₪." };
  }

  const { error } = await supabase.rpc("place_bid", {
    p_listing_id: listingId,
    p_amount_agorot: amount,
  });

  if (error) {
    const hint = "hint" in error ? String(error.hint ?? "") : null;
    return { error: mapNbcError(error.message, hint) };
  }

  revalidatePath(next);
  revalidatePath("/");
  revalidatePath("/auctions");
  return null;
}
