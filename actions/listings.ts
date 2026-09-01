"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { parseListingForm } from "@/lib/listings/parse-form";
import { listingImageExt } from "@/lib/listings/storage";

export type ListingFormState = { error: string } | null;

async function requireSeller() {
  const ctx = await getAuthContext();
  if (!ctx.user) {
    redirect("/login?next=/sell");
  }
  if (!ctx.profile?.has_chosen_username) {
    redirect("/account/username");
  }
  return ctx;
}

export async function createDraftListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, supabase } = await requireSeller();
  const parsed = parseListingForm(formData);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const { error } = await supabase
    .from("listings")
    .insert({
      ...parsed.row,
      seller_id: user.id,
      status: "draft",
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  redirect("/account");
}

export async function updateDraftListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, supabase } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing listing id." };
  }

  const parsed = parseListingForm(formData);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const { slug: _newSlug, ...fields } = parsed.row;

  const { error } = await supabase
    .from("listings")
    .update(fields)
    .eq("id", id)
    .eq("seller_id", user.id)
    .in("status", ["draft", "pending_review"]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath(`/sell/${id}`);
  revalidatePath(`/auctions/${parsed.row.slug}`);
  return null;
}

export async function deleteDraftListing(formData: FormData) {
  const { user, supabase } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)
    .eq("status", "draft");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/account");
  redirect("/account");
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function uploadListingImage(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, supabase } = await requireSeller();
  const listingId = String(formData.get("listing_id") ?? "");
  const file = formData.get("file");

  if (!listingId) {
    return { error: "Missing listing." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a JPEG, PNG, or WebP image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 10 MB or smaller." };
  }
  const ext = listingImageExt(file.type);
  if (!ext) {
    return { error: "Use JPEG, PNG, or WebP." };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, status")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!listing || !["draft", "pending_review"].includes(listing.status)) {
    return { error: "You can only add photos to an editable draft." };
  }

  const { count } = await supabase
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  const path = `${listingId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: rowError } = await supabase.from("listing_images").insert({
    listing_id: listingId,
    storage_path: path,
    alt: listing.slug,
    sort_order: count ?? 0,
    is_cover: (count ?? 0) === 0,
  });

  if (rowError) {
    await supabase.storage.from("listing-images").remove([path]);
    return { error: rowError.message };
  }

  revalidatePath(`/sell/${listingId}`);
  revalidatePath(`/auctions/${listing.slug}`);
  revalidatePath("/");
  revalidatePath("/auctions");
  revalidatePath("/account");
  return null;
}

export async function deleteListingImage(formData: FormData) {
  const { user, supabase } = await requireSeller();
  const listingId = String(formData.get("listing_id") ?? "");
  const imageId = String(formData.get("image_id") ?? "");

  const { data: image } = await supabase
    .from("listing_images")
    .select("id, storage_path, listing_id")
    .eq("id", imageId)
    .maybeSingle();

  if (!image || image.listing_id !== listingId) {
    return;
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, seller_id, status")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!listing || !["draft", "pending_review"].includes(listing.status)) {
    return;
  }

  await supabase.from("listing_images").delete().eq("id", imageId);
  await supabase.storage.from("listing-images").remove([image.storage_path]);

  revalidatePath(`/sell/${listingId}`);
  revalidatePath(`/auctions/${listing.slug}`);
  revalidatePath("/");
  revalidatePath("/auctions");
}

export async function setCoverImage(formData: FormData) {
  const { user, supabase } = await requireSeller();
  const listingId = String(formData.get("listing_id") ?? "");
  const imageId = String(formData.get("image_id") ?? "");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, status")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!listing || !["draft", "pending_review"].includes(listing.status)) {
    return;
  }

  await supabase
    .from("listing_images")
    .update({ is_cover: false })
    .eq("listing_id", listingId);
  await supabase
    .from("listing_images")
    .update({ is_cover: true })
    .eq("id", imageId)
    .eq("listing_id", listingId);

  revalidatePath(`/sell/${listingId}`);
  revalidatePath(`/auctions/${listing.slug}`);
  revalidatePath("/");
  revalidatePath("/auctions");
}
