import Image from "next/image";
import type { ListingImage } from "@/lib/listings/types";

export function ListingGallery({
  images,
  fallbackLabel,
}: {
  images: ListingImage[];
  fallbackLabel: string;
}) {
  const hero = images.find((img) => img.is_cover) ?? images[0];

  if (!hero?.url) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={hero.url}
          alt={hero.alt ?? fallbackLabel}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 768px, 100vw"
          priority
          unoptimized
        />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2">
          {images.map((image) =>
            image.url ? (
              <li
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900"
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? fallbackLabel}
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
