import { createDraftListing } from "@/actions/listings";
import { ListingForm } from "@/components/sell/listing-form";

export default function NewListingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Sell a car</h1>
      <p className="text-sm text-zinc-500">
        Saved as a <strong>draft</strong>. You will return to your account;
        open <strong>Edit</strong> there to add photos.
      </p>
      <ListingForm action={createDraftListing} submitLabel="Create draft" />
    </div>
  );
}
