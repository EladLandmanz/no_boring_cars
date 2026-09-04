import Link from "next/link";
import { cancelListing } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { listAdminListings } from "@/lib/listings/queries";

const CANCELLABLE = new Set(["draft", "pending_review", "upcoming", "live"]);

export default async function AdminPage() {
  const listings = await listAdminListings();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-500">
          Cancel removes a lot from public browse. It does not delete bid
          history. Hard-delete a draft with no bids from the Supabase table
          editor if you truly need the row gone.
        </p>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-zinc-500">No listings.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 py-3 text-sm dark:border-zinc-800"
            >
              <div className="flex flex-col gap-1">
                <span>
                  {listing.headline}{" "}
                  <span className="text-zinc-500">({listing.status})</span>
                </span>
                <span className="text-xs text-zinc-500">
                  {listing.year} {listing.make} {listing.model}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/auctions/${listing.slug}`} className="underline">
                  View
                </Link>
                {CANCELLABLE.has(listing.status) ? (
                  <form action={cancelListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <ConfirmSubmit
                      label="Cancel"
                      message={`Remove “${listing.headline}” from the site?`}
                    />
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
