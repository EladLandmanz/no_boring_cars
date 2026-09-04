import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDraftListing, updateDraftListing } from "@/actions/listings";
import { ListingForm } from "@/components/sell/listing-form";
import { ListingPhotos } from "@/components/sell/listing-photos";
import { SubmitForReviewButton } from "@/components/sell/publish-button";
import { getEditableListing, listListingImages } from "@/lib/listings/queries";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photos?: string; reason?: string }>;
}) {
  const { id } = await params;
  const photoQuery = await searchParams;
  const listing = await getEditableListing(id);
  if (!listing) {
    notFound();
  }

  const images = await listListingImages(listing.id);
  const editable =
    listing.status === "draft" || listing.status === "pending_review";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {listing.status}
        </p>
        <h1 className="text-2xl font-semibold">Edit listing</h1>
        <p className="text-sm text-zinc-500">
          Slug: <code>{listing.slug}</code>
          {" · "}
          <Link
            href={`/auctions/${listing.slug}`}
            className="underline"
          >
            Preview
          </Link>{" "}
          (visible to you while it is a draft; guests will 404)
        </p>
        {photoQuery.photos === "failed" ? (
          <p className="text-sm text-red-600" role="alert">
            The draft was saved, but photos did not upload
            {photoQuery.reason ? `: ${photoQuery.reason}` : "."} Try again
            below. If this mentions the bucket or row-level security, run
            supabase/migrations in the SQL Editor.
          </p>
        ) : null}
      </div>

      <ListingPhotos
        listingId={listing.id}
        images={images}
        editable={editable}
      />

      {editable ? (
        <SubmitForReviewButton
          listingId={listing.id}
          status={listing.status}
          canSubmit={
            Boolean(listing.starts_at && listing.ends_at) && images.length > 0
          }
        />
      ) : null}

      {editable ? (
        <ListingForm
          action={updateDraftListing}
          listing={listing}
          submitLabel="Save draft"
        />
      ) : (
        <p className="text-sm text-zinc-500">
          This listing is no longer editable from the seller form.
        </p>
      )}

      {listing.status === "draft" ? (
        <form action={deleteDraftListing}>
          <input type="hidden" name="id" value={listing.id} />
          <button
            type="submit"
            className="text-sm text-red-600 underline"
          >
            Delete draft
          </button>
        </form>
      ) : null}
    </div>
  );
}
