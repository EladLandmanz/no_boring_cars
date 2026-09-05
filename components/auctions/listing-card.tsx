import Image from "next/image";
import Link from "next/link";
import { currentPriceAgorot, formatIls } from "@/lib/money";
import type { ListingCardData } from "@/lib/listings/types";

function statusLabel(status: string) {
  switch (status) {
    case "live":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "sold":
      return "Sold";
    case "reserve_not_met":
      return "Reserve not met";
    case "unsold":
      return "Unsold";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "live":
      return "text-live";
    case "sold":
      return "text-brand";
    default:
      return "text-zinc-500";
  }
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const price =
    listing.status === "sold" && listing.sold_price_agorot != null
      ? listing.sold_price_agorot
      : currentPriceAgorot(
          listing.starting_bid_agorot,
          listing.high_bid_agorot,
        );

  const when =
    listing.status === "upcoming" && listing.starts_at
      ? `Starts ${new Date(listing.starts_at).toLocaleString("en-IL")}`
      : listing.ends_at
        ? `Ends ${new Date(listing.ends_at).toLocaleString("en-IL")}`
        : null;

  return (
    <Link
      href={`/auctions/${listing.slug}`}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white hover:border-brand dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-brand"
    >
      <div className="relative flex aspect-[16/10] items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
        {listing.cover_url ? (
          <Image
            src={listing.cover_url}
            alt={listing.headline}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 50vw, 100vw"
            unoptimized
          />
        ) : (
          `${listing.year} ${listing.make} ${listing.model}`
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${statusClass(listing.status)}`}
        >
          {statusLabel(listing.status)}
        </p>
        <h2 className="text-base font-semibold leading-snug">
          {listing.headline}
        </h2>
        <p className="text-sm text-zinc-500">
          {listing.mileage.toLocaleString("en-IL")} mi · {listing.location_city}
          , {listing.location_region}
        </p>
        <p className="mt-auto pt-2 text-lg font-medium">{formatIls(price)}</p>
        {when ? <p className="text-xs text-zinc-500">{when}</p> : null}
      </div>
    </Link>
  );
}
