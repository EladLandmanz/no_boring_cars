import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "listing-images";
const SIGNED_TTL_SECONDS = 60 * 60;

export async function signedUrlsForPaths(
  supabase: SupabaseClient,
  paths: string[],
) {
  if (paths.length === 0) return new Map<string, string>();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_TTL_SECONDS);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}

export type ListingPhotoFile = Blob & { name?: string; type: string };

/** FormData files in Server Actions are not always `instanceof File`. */
export function asListingPhotoFile(value: unknown): ListingPhotoFile | null {
  if (typeof value !== "object" || value === null) return null;
  const blob = value as Blob & { name?: string; type: string };
  if (typeof blob.size !== "number" || blob.size <= 0) return null;
  if (typeof blob.arrayBuffer !== "function") return null;
  return blob;
}

export function listingImageExt(mime: string, filename = "") {
  const type = mime.toLowerCase().split(";")[0].trim();
  if (type === "image/jpeg" || type === "image/jpg" || type === "image/pjpeg") {
    return "jpg";
  }
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";

  const name = filename.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  return null;
}
