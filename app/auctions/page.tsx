import { ListingCard } from "@/components/auctions/listing-card";
import { listPublicListings } from "@/lib/listings/queries";

export default async function AuctionsPage() {
  const listings = await listPublicListings();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold">Auctions</h1>
      {listings.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing public yet. Seed the database with{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            supabase/seed.sql
          </code>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
