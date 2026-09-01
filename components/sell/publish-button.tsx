"use client";

import { useActionState } from "react";
import { publishListing } from "@/actions/listings";

export function PublishButton({
  listingId,
  canPublish,
}: {
  listingId: string;
  canPublish: boolean;
}) {
  const [state, formAction, pending] = useActionState(publishListing, null);

  if (!canPublish) {
    return (
      <p className="text-sm text-zinc-500">
        Save start and end times on the draft before you can publish. If start
        is in the future the listing becomes <strong>upcoming</strong>;
        otherwise it goes <strong>live</strong>.
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
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Publishing…" : "Publish auction"}
      </button>
    </form>
  );
}
