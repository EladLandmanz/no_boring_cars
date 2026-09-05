"use client";

import Link from "next/link";
import { useActionState, useCallback } from "react";
import { placeBid, type BidFormState } from "@/actions/bids";
import { agorotToIlsInput } from "@/lib/listings/format";
import { formatIls } from "@/lib/money";

export function BidPanel({
  listingId,
  slug,
  status,
  minNextAgorot,
  endsAt,
  startsAt,
  isOwner,
  isLoggedIn,
  onPlaced,
}: {
  listingId: string;
  slug: string;
  status: string;
  minNextAgorot: number;
  endsAt: string | null;
  startsAt: string | null;
  isOwner: boolean;
  isLoggedIn: boolean;
  onPlaced?: () => Promise<void>;
}) {
  const submitBid = useCallback(
    async (prev: BidFormState, formData: FormData) => {
      const result = await placeBid(prev, formData);
      if (!result?.error) {
        await onPlaced?.();
      }
      return result;
    },
    [onPlaced],
  );
  const [state, formAction, pending] = useActionState(submitBid, null);
  const next = `/auctions/${slug}`;

  if (status === "upcoming") {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        Bidding opens{" "}
        {startsAt ? new Date(startsAt).toLocaleString("en-IL") : "soon"}.
      </p>
    );
  }

  if (status !== "live") {
    return (
      <p className="mt-4 text-sm text-zinc-500">This auction is not live.</p>
    );
  }

  if (isOwner) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        You cannot bid on your own listing.
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className="mt-4 text-sm">
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="underline"
        >
          Log in
        </Link>{" "}
        to bid. Minimum {formatIls(minNextAgorot)}.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="flex flex-col gap-1 text-sm">
        Your bid (₪)
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          type="number"
          name="amount_ils"
          required
          min={agorotToIlsInput(minNextAgorot)}
          step="0.01"
          defaultValue={agorotToIlsInput(minNextAgorot)}
        />
      </label>
      <p className="text-xs text-zinc-500">
        Minimum {formatIls(minNextAgorot)}
        {endsAt
          ? ` · ends ${new Date(endsAt).toLocaleString("en-IL")}`
          : null}
        . A bid in the last 2 minutes extends the clock.
      </p>
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
        {pending ? "Placing bid…" : "Place bid"}
      </button>
    </form>
  );
}
