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

export function listingImageExt(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}
