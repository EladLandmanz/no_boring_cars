"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { parseListingForm } from "@/lib/listings/parse-form";
import {
  asListingPhotoFile,
  listingImageExt,
  type ListingPhotoFile,
} from "@/lib/listings/storage";
import { mapNbcError } from "@/lib/supabase/errors";

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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_CREATE_PHOTOS = 12;

type SellerClient = Awaited<ReturnType<typeof requireSeller>>["supabase"];

function listingPhotoFiles(formData: FormData) {
  return formData.getAll("photos").flatMap((value) => {
    const file = asListingPhotoFile(value);
    return file ? [file] : [];
  });
}

function validateListingPhoto(file: ListingPhotoFile) {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Each image must be 10 MB or smaller.";
  }
  if (!listingImageExt(file.type, file.name ?? "")) {
    return "Use JPEG, PNG, or WebP.";
  }
  return null;
}

async function storeListingPhoto(
  supabase: SellerClient,
  listing: { id: string; slug: string },
  file: ListingPhotoFile,
  sortOrder: number,
  isCover: boolean,
) {
  const ext = listingImageExt(file.type, file.name ?? "");
  if (!ext) {
    return "Use JPEG, PNG, or WebP.";
  }

  const path = `${listing.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, bytes, { contentType, upsert: false });

  if (uploadError) {
    return uploadError.message;
  }

  const { error: rowError } = await supabase.from("listing_images").insert({
    listing_id: listing.id,
    storage_path: path,
    alt: listing.slug,
    sort_order: sortOrder,
    is_cover: isCover,
  });

  if (rowError) {
    await supabase.storage.from("listing-images").remove([path]);
    return rowError.message;
  }

  return null;
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

  const photos = listingPhotoFiles(formData);
  const rawPhotoCount = formData.getAll("photos").length;
  if (rawPhotoCount > 0 && photos.length === 0) {
    const first = formData.get("photos");
    const looksEmpty =
      typeof first === "object" &&
      first !== null &&
      "size" in first &&
      (first as { size: number }).size === 0;
    if (!looksEmpty) {
      return {
        error:
          "The selected photos could not be read. Use JPEG, PNG, or WebP.",
      };
    }
  }
  if (photos.length > MAX_CREATE_PHOTOS) {
    return { error: `You can attach up to ${MAX_CREATE_PHOTOS} photos here.` };
  }
  for (const photo of photos) {
    const invalid = validateListingPhoto(photo);
    if (invalid) {
      return { error: invalid };
    }
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      ...parsed.row,
      seller_id: user.id,
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error || !listing) {
    return { error: error?.message ?? "Could not create draft." };
  }

  let sortOrder = 0;
  let hasCover = false;
  let lastPhotoError: string | null = null;
  for (const photo of photos) {
    const photoError = await storeListingPhoto(
      supabase,
      listing,
      photo,
      sortOrder,
      !hasCover,
    );
    if (photoError) {
      lastPhotoError = photoError;
      continue;
    }
    hasCover = true;
    sortOrder += 1;
  }

  revalidatePath("/account");
  revalidatePath(`/sell/${listing.id}`);
  if (photos.length > 0 && !hasCover && lastPhotoError) {
    redirect(
      `/sell/${listing.id}?photos=failed&reason=${encodeURIComponent(lastPhotoError)}`,
    );
  }
  redirect(`/sell/${listing.id}`);
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

export async function publishListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { supabase } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing listing id." };
  }

  const { error } = await supabase.rpc("publish_listing", {
    p_listing_id: id,
  });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return {
        error:
          "Run supabase/migrations/20260901120000_publish_listing.sql in the SQL Editor first.",
      };
    }
    const hint = "hint" in error ? String(error.hint ?? "") : null;
    return { error: mapNbcError(error.message, hint) };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/auctions");
  if (listing?.slug) {
    revalidatePath(`/auctions/${listing.slug}`);
  }
  revalidatePath(`/sell/${id}`);
  redirect(`/auctions/${listing?.slug ?? ""}`);
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

export async function uploadListingImage(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, supabase } = await requireSeller();
  const listingId = String(formData.get("listing_id") ?? "");
  const file = asListingPhotoFile(formData.get("file"));

  if (!listingId) {
    return { error: "Missing listing." };
  }
  if (!file) {
    return { error: "Choose a JPEG, PNG, or WebP image." };
  }
  const invalid = validateListingPhoto(file);
  if (invalid) {
    return { error: invalid };
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

  const photoError = await storeListingPhoto(
    supabase,
    listing,
    file,
    count ?? 0,
    (count ?? 0) === 0,
  );
  if (photoError) {
    return { error: photoError };
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
