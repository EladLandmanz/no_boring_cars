"use client";

import { useActionState } from "react";
import {
  submitListingForReview,
  withdrawListingFromReview,
} from "@/actions/listings";

export function SubmitForReviewButton({
  listingId,
  status,
  canSubmit,
}: {
  listingId: string;
  status: string;
  canSubmit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitListingForReview,
    null,
  );

  if (status === "pending_review") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-500">
          This listing is waiting for admin approval. You can keep editing, or
          withdraw it back to a draft.
        </p>
        <form action={withdrawListingFromReview}>
          <input type="hidden" name="id" value={listingId} />
          <button type="submit" className="text-sm underline">
            Withdraw from review
          </button>
        </form>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <p className="text-sm text-zinc-500">
        Add at least one photo and save start and end times before submitting
        for review. After an admin approves, a future start time becomes{" "}
        <strong>upcoming</strong>; otherwise it goes <strong>live</strong>.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={listingId} />
      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
