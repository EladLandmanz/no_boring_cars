import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGallery } from "@/components/auctions/listing-gallery";
import { getListingBySlug } from "@/lib/listings/queries";
import { currentPriceAgorot, formatIls } from "@/lib/money";

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

  const price =
    listing.status === "sold" && listing.sold_price_agorot != null
      ? listing.sold_price_agorot
      : currentPriceAgorot(
          listing.starting_bid_agorot,
          listing.high_bid_agorot,
        );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <Link href="/auctions" className="text-sm text-zinc-500 hover:underline">
        ← All auctions
      </Link>

      <ListingGallery
        images={listing.images}
        fallbackLabel={`${listing.year} ${listing.make} ${listing.model}`}
      />

      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {listing.status.replaceAll("_", " ")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {listing.headline}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {listing.location_city}, {listing.location_region} · listed by @
          {listing.seller?.username ?? "seller"}
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">
          {listing.status === "sold" ? "Sold for" : "Current price"}
        </p>
        <p className="text-3xl font-semibold">{formatIls(price)}</p>
        <p className="mt-1 text-sm text-zinc-500">
          Starting {formatIls(listing.starting_bid_agorot)} · increment{" "}
          {formatIls(listing.bid_increment_agorot)}
          {listing.reserve_agorot != null
            ? ` · reserve ${formatIls(listing.reserve_agorot)}`
            : " · no reserve"}
        </p>
        {listing.ends_at ? (
          <p className="mt-2 text-sm text-zinc-500">
            Ends {new Date(listing.ends_at).toLocaleString("en-IL")}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-zinc-400">
          Bidding is disabled until the next phase.
        </p>
      </section>

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

      <section>
        <h2 className="mb-2 text-lg font-semibold">Bid history</h2>
        {listing.bids.length === 0 ? (
          <p className="text-sm text-zinc-500">No bids yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {listing.bids.map((bid) => (
              <li
                key={bid.id}
                className="flex justify-between border-b border-zinc-100 py-2 dark:border-zinc-800"
              >
                <span>@{bid.bidder?.username ?? "bidder"}</span>
                <span>
                  {formatIls(bid.amount_agorot)} ·{" "}
                  {new Date(bid.created_at).toLocaleString("en-IL")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
