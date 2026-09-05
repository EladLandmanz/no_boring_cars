import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminReviewActions } from "@/components/admin/review-actions";
import {
  AuctionBidHistory,
  AuctionLiveProvider,
  AuctionPricePanel,
} from "@/components/auctions/auction-live";
import { ListingGallery } from "@/components/auctions/listing-gallery";
import { WatchButton } from "@/components/auctions/watch-button";
import { getAuthContext } from "@/lib/auth/session";
import { getListingBySlug, isListingWatched } from "@/lib/listings/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Auction not found" };
  return { title: `${listing.headline} · No Boring Cars` };
}

function spec(label: string, value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 py-2 text-sm dark:border-zinc-800">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default async function AuctionPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) {
    notFound();
  }

  const { user, profile } = await getAuthContext();
  const watching = user ? await isListingWatched(listing.id) : false;
  const isOwner = user?.id === listing.seller_id;
  const isAdmin = profile?.role === "admin";
  const isPendingReview = listing.status === "pending_review";
  const liveInitial = {
    status: listing.status,
    starting_bid_agorot: listing.starting_bid_agorot,
    bid_increment_agorot: listing.bid_increment_agorot,
    reserve_agorot: listing.reserve_agorot,
    ends_at: listing.ends_at,
    starts_at: listing.starts_at,
    sold_price_agorot: listing.sold_price_agorot,
    high_bid_agorot: listing.high_bid_agorot,
    bids: listing.bids,
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <Link
        href={isAdmin && isPendingReview ? "/admin" : "/auctions"}
        className="text-sm text-zinc-500 hover:underline"
      >
        {isAdmin && isPendingReview ? "← Admin" : "← All auctions"}
      </Link>

      <ListingGallery
        images={listing.images}
        fallbackLabel={`${listing.year} ${listing.make} ${listing.model}`}
      />

      <header className="flex flex-col gap-2">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            listing.status === "live"
              ? "text-live"
              : listing.status === "sold"
                ? "text-brand"
                : "text-zinc-500"
          }`}
        >
          {listing.status.replaceAll("_", " ")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {listing.headline}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {listing.location_city}, {listing.location_region} · listed by @
          {listing.seller?.username ?? "seller"}
        </p>
        {isOwner ? null : (
          <WatchButton
            listingId={listing.id}
            slug={listing.slug}
            watching={watching}
          />
        )}
        {isAdmin && isPendingReview ? (
          <div className="pt-2">
            <AdminReviewActions
              listingId={listing.id}
              headline={listing.headline}
              status={listing.status}
              variant="button"
            />
          </div>
        ) : null}
      </header>

      <AuctionLiveProvider listingId={listing.id} initial={liveInitial}>
        <AuctionPricePanel
          listingId={listing.id}
          slug={listing.slug}
          isOwner={isOwner}
          isLoggedIn={Boolean(user)}
        />

      <section>
        <h2 className="mb-3 text-lg font-semibold">The car</h2>
        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {listing.description}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Specs</h2>
        <dl>
          {spec("Year", listing.year)}
          {spec("Make", listing.make)}
          {spec("Model", listing.model)}
          {spec("Trim", listing.trim)}
          {spec("VIN", listing.vin)}
          {spec("Mileage", `${listing.mileage.toLocaleString("en-IL")} mi`)}
          {spec("Drivetrain", listing.drivetrain.toUpperCase())}
          {spec("Transmission", listing.transmission)}
          {spec("Gears", listing.gears)}
          {spec("Engine", listing.engine)}
          {spec("Horsepower", listing.horsepower)}
          {spec("Fuel", listing.fuel)}
          {spec("Exterior", listing.exterior_color)}
          {spec("Interior", listing.interior_color)}
          {spec("Title", listing.title_status)}
          {spec("Track use", listing.track_use ? "Yes" : "No")}
          {spec("Modified", listing.is_modified ? "Yes" : "No")}
        </dl>
      </section>

      {listing.listing_modifications.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Modifications</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {listing.listing_modifications.map((mod) => (
              <li key={mod.id}>
                <span className="text-zinc-500">{mod.category}: </span>
                {mod.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.modifications_summary ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Mods notes</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {listing.modifications_summary}
          </p>
        </section>
      ) : null}

      {listing.service_notes ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Service</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {listing.service_notes}
          </p>
        </section>
      ) : null}

        <AuctionBidHistory />
      </AuctionLiveProvider>
    </div>
  );
}
