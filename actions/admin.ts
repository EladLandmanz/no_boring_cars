"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { mapNbcError } from "@/lib/supabase/errors";

export type AdminFormState = { error: string } | null;

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

function revalidateListing(id: string, slug: string | null) {
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/auctions");
  revalidatePath(`/sell/${id}`);
  if (slug) {
    revalidatePath(`/auctions/${slug}`);
  }
}

export async function approveListing(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing listing id." };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("publish_listing", {
    p_listing_id: id,
  });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return {
        error:
          "Run supabase/migrations/20260904133000_listing_review.sql in the SQL Editor first.",
      };
    }
    const hint = "hint" in error ? String(error.hint ?? "") : null;
    return { error: mapNbcError(error.message, hint) };
  }

  revalidateListing(id, listing?.slug ?? null);
  redirect("/admin");
}

export async function rejectListing(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing listing id." };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("reject_listing", {
    p_listing_id: id,
  });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return {
        error:
          "Run supabase/migrations/20260904133000_listing_review.sql in the SQL Editor first.",
      };
    }
    const hint = "hint" in error ? String(error.hint ?? "") : null;
    return { error: mapNbcError(error.message, hint) };
  }

  revalidateListing(id, listing?.slug ?? null);
  redirect("/admin");
}
