import Link from "next/link";
import { cancelListing } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { AdminReviewActions } from "@/components/admin/review-actions";
import { listAdminListings } from "@/lib/listings/queries";

const CANCELLABLE = new Set(["draft", "pending_review", "upcoming", "live"]);
const STATUS_RANK: Record<string, number> = {
  pending_review: 0,
  draft: 1,
  upcoming: 2,
  live: 3,
};

export default async function AdminPage() {
  const listings = [...(await listAdminListings())].sort((a, b) => {
    const rank =
      (STATUS_RANK[a.status] ?? 8) - (STATUS_RANK[b.status] ?? 8);
    if (rank !== 0) return rank;
    return b.created_at.localeCompare(a.created_at);
  });
  const pendingCount = listings.filter(
    (listing) => listing.status === "pending_review",
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-500">
          Sellers submit drafts for review. Approve puts the lot on the public
          calendar. Send back returns it to a draft. Cancel removes it from
          public browse without deleting bid history.
        </p>
        <p className="text-sm text-zinc-500">
          {pendingCount === 0
            ? "No listings waiting for review."
            : `${pendingCount} waiting for review.`}
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
                {listing.status === "pending_review" ||
                listing.status === "draft" ? (
                  <AdminReviewActions
                    listingId={listing.id}
                    headline={listing.headline}
                    status={listing.status}
                  />
                ) : null}
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
