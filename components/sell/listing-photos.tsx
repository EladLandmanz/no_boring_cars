"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  deleteListingImage,
  setCoverImage,
  uploadListingImage,
} from "@/actions/listings";
import type { ListingImage } from "@/lib/listings/types";

export function ListingPhotos({
  listingId,
  images,
  editable,
}: {
  listingId: string;
  images: ListingImage[];
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadListingImage, null);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Photos</h2>
      <p className="text-sm text-zinc-500">
        JPEG, PNG, or WebP, up to 10 MB. Stored in the private{" "}
        <code>listing-images</code> bucket as{" "}
        <code>{listingId}/…</code>.
      </p>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="flex flex-col gap-2 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              {image.url ? (
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={image.url}
                    alt={image.alt ?? "Listing photo"}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-xs text-zinc-500">
                  Could not sign URL
                </div>
              )}
              <div className="flex flex-wrap gap-2 px-2 pb-2 text-xs">
                {image.is_cover ? (
                  <span className="text-zinc-500">Cover</span>
                ) : editable ? (
                  <form action={setCoverImage}>
                    <input type="hidden" name="listing_id" value={listingId} />
                    <input type="hidden" name="image_id" value={image.id} />
                    <button type="submit" className="underline">
                      Set cover
                    </button>
                  </form>
                ) : null}
                {editable ? (
                  <form action={deleteListingImage}>
                    <input type="hidden" name="listing_id" value={listingId} />
                    <input type="hidden" name="image_id" value={image.id} />
                    <button type="submit" className="text-red-600 underline">
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No photos yet.</p>
      )}

      {editable ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="listing_id" value={listingId} />
          <input
            className="text-sm"
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          {state?.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Uploading…" : "Upload photo"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
