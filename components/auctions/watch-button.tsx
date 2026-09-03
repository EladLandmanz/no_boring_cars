"use client";

import { useFormStatus } from "react-dom";
import { toggleWatch } from "@/actions/watches";

function WatchSubmit({ watching }: { watching: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-500 disabled:opacity-60 dark:border-zinc-700"
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
