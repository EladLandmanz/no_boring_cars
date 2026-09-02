import { Suspense } from "react";
import { ListingCard } from "@/components/auctions/listing-card";
import { SearchFallback } from "@/components/auctions/search-fallback";
import { Search } from "@/components/auctions/search";
import { listPublicListings } from "@/lib/listings/queries";
import { firstSearchParam } from "@/lib/listings/search";

async function AuctionResults({ query }: { query: string }) {
  const listings = await listPublicListings(query);

  if (listings.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {query
          ? `No auctions match “${query}”.`
          : "Nothing public yet."}
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
  searchParams: Promise<{ query?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = firstSearchParam(params.query).trim();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold">Auctions</h1>
        <Suspense fallback={<SearchFallback placeholder="Search make, model…" />}>
          <Search placeholder="Search make, model, city…" />
        </Suspense>
      </div>
      <Suspense key={query} fallback={<ResultsFallback />}>
        <AuctionResults query={query} />
      </Suspense>
    </div>
  );
}
