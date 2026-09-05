"use client";

import { useFormStatus } from "react-dom";
import { toggleWatch } from "@/actions/watches";

function WatchSubmit({ watching }: { watching: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        watching
          ? "rounded-md border border-live bg-live px-3 py-1.5 text-sm font-medium text-white hover:bg-live-hover disabled:opacity-60"
          : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:border-live disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
      }
    >
      {pending ? "Saving…" : watching ? "Watching" : "Watch"}
    </button>
  );
}

export function WatchButton({
  listingId,
  slug,
  watching,
}: {
  listingId: string;
  slug: string;
  watching: boolean;
}) {
  return (
    <form action={toggleWatch}>
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <WatchSubmit watching={watching} />
    </form>
  );
}
