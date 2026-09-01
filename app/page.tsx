import { ListingCard } from "@/components/auctions/listing-card";
import { listPublicListings } from "@/lib/listings/queries";

export default async function HomePage() {
  const listings = await listPublicListings();
  const live = listings.filter((l) => l.status === "live");
  const rest = listings.filter((l) => l.status !== "live");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          No boring cars.
        </h1>
        <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
          Timed auctions for enthusiast and track cars in Israel. Bidding comes
          in a later phase — for now you can browse live and past listings.
        </p>
      </section>

      {listings.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          No public auctions yet. After you have a user in Authentication, run
          <code className="mx-1 rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            supabase/seed.sql
          </code>
          in the Supabase SQL Editor.
        </p>
      ) : (
        <>
          {live.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Live now</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {live.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ) : null}
          {rest.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Also on the board</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
