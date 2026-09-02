import { Suspense } from "react";
import { BrowseFiltersBar } from "@/components/auctions/browse-filters";
import { ListingCard } from "@/components/auctions/listing-card";
import { SearchFallback } from "@/components/auctions/search-fallback";
import { Search } from "@/components/auctions/search";
import {
  listPublicListings,
  listPublicMakes,
} from "@/lib/listings/queries";
import {
  browseCacheKey,
  parseBrowseFilters,
  type AuctionSearchParams,
  type BrowseFilters,
} from "@/lib/listings/search";

async function AuctionResults({ filters }: { filters: BrowseFilters }) {
  const listings = await listPublicListings(filters);
  const filtered = Boolean(
    filters.query || filters.status || filters.make || filters.track,
  );

  if (listings.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {filtered ? "No auctions match those filters." : "Nothing public yet."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function ResultsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="aspect-[16/10] rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<AuctionSearchParams>;
}) {
  const filters = parseBrowseFilters(await searchParams);
  const makes = await listPublicMakes();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold">Auctions</h1>
        <Suspense fallback={<SearchFallback placeholder="Search make, model…" />}>
          <Search placeholder="Search make, model, city…" />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <BrowseFiltersBar filters={filters} makes={makes} />
      </Suspense>
      <Suspense key={browseCacheKey(filters)} fallback={<ResultsFallback />}>
        <AuctionResults filters={filters} />
      </Suspense>
    </div>
  );
}
