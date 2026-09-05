"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BidPanel } from "@/components/auctions/bid-panel";
import { createClient } from "@/lib/supabase/client";
import { currentPriceAgorot, formatIls, minNextBidAgorot } from "@/lib/money";

export type LiveBidRow = {
  id: string;
  amount_agorot: number;
  created_at: string;
  bidder: { username: string } | null;
};

export type LiveAuctionSnapshot = {
  status: string;
  starting_bid_agorot: number;
  bid_increment_agorot: number;
  reserve_agorot: number | null;
  ends_at: string | null;
  starts_at: string | null;
  sold_price_agorot: number | null;
  high_bid_agorot: number | null;
  bids: LiveBidRow[];
};

async function fetchLiveAuction(
  listingId: string,
): Promise<LiveAuctionSnapshot | null> {
  const supabase = createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "status, starting_bid_agorot, bid_increment_agorot, reserve_agorot, ends_at, starts_at, sold_price_agorot",
    )
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) {
    return null;
  }

  const { data: bidRows } = await supabase
    .from("bids")
    .select("id, amount_agorot, created_at, bidder_id")
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  const bidderIds = [...new Set((bidRows ?? []).map((bid) => bid.bidder_id))];
  const { data: bidders } =
    bidderIds.length > 0
      ? await supabase.from("profiles").select("id, username").in("id", bidderIds)
      : { data: [] as { id: string; username: string }[] };

  const nameById = new Map((bidders ?? []).map((row) => [row.id, row.username]));
  const bids: LiveBidRow[] = (bidRows ?? []).map((bid) => ({
    id: bid.id,
    amount_agorot: bid.amount_agorot,
    created_at: bid.created_at,
    bidder: nameById.has(bid.bidder_id)
      ? { username: nameById.get(bid.bidder_id) as string }
      : null,
  }));

  const high =
    bids.length === 0
      ? null
      : Math.max(...bids.map((bid) => bid.amount_agorot));

  return {
    status: listing.status,
    starting_bid_agorot: listing.starting_bid_agorot,
    bid_increment_agorot: listing.bid_increment_agorot,
    reserve_agorot: listing.reserve_agorot,
    ends_at: listing.ends_at,
    starts_at: listing.starts_at,
    sold_price_agorot: listing.sold_price_agorot,
    high_bid_agorot: high,
    bids,
  };
}

const LiveAuctionContext = createContext<{
  live: LiveAuctionSnapshot;
  pull: () => Promise<void>;
} | null>(null);

function useLiveAuction() {
  const value = useContext(LiveAuctionContext);
  if (!value) {
    throw new Error("Auction live context missing");
  }
  return value;
}

export function AuctionLiveProvider({
  listingId,
  initial,
  children,
}: {
  listingId: string;
  initial: LiveAuctionSnapshot;
  children: ReactNode;
}) {
  const [live, setLive] = useState(initial);

  const pull = useCallback(async () => {
    const next = await fetchLiveAuction(listingId);
    if (next) {
      setLive(next);
    }
  }, [listingId]);

  useEffect(() => {
    const watching = live.status === "live" || live.status === "upcoming";
    if (!watching) {
      return;
    }

    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const schedulePull = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void pull();
      }, 50);
    };

    const channel = supabase
      .channel(`listing-live:${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids" },
        (payload) => {
          const row = payload.new as { listing_id?: string };
          if (row.listing_id === listingId) {
            schedulePull();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listings" },
        (payload) => {
          const row = payload.new as { id?: string };
          if (row.id === listingId) {
            schedulePull();
          }
        },
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [listingId, live.status, pull]);

  return (
    <LiveAuctionContext.Provider value={{ live, pull }}>
      {children}
    </LiveAuctionContext.Provider>
  );
}

export function AuctionPricePanel({
  listingId,
  slug,
  isOwner,
  isLoggedIn,
}: {
  listingId: string;
  slug: string;
  isOwner: boolean;
  isLoggedIn: boolean;
}) {
  const { live, pull } = useLiveAuction();
  const price =
    live.status === "sold" && live.sold_price_agorot != null
      ? live.sold_price_agorot
      : currentPriceAgorot(live.starting_bid_agorot, live.high_bid_agorot);
  const [priceFlash, setPriceFlash] = useState(false);
  const lastPrice = useRef<number | null>(null);

  useEffect(() => {
    if (lastPrice.current === null) {
      lastPrice.current = price;
      return;
    }
    if (lastPrice.current === price) {
      return;
    }
    lastPrice.current = price;
    setPriceFlash(true);
    const timeout = setTimeout(() => setPriceFlash(false), 650);
    return () => clearTimeout(timeout);
  }, [price]);

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">
        {live.status === "sold" ? "Sold for" : "Current price"}
      </p>
        <p
          className={`text-3xl font-semibold transition-colors duration-700 ${
            priceFlash
              ? "text-green-600 dark:text-green-400"
              : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {formatIls(price)}
        </p>
      <p className="mt-1 text-sm text-zinc-500">
        Starting {formatIls(live.starting_bid_agorot)} · increment{" "}
        {formatIls(live.bid_increment_agorot)}
        {live.reserve_agorot != null
          ? ` · reserve ${formatIls(live.reserve_agorot)}`
          : " · no reserve"}
      </p>
      {live.ends_at ? (
        <p className="mt-2 text-sm text-zinc-500">
          Ends {new Date(live.ends_at).toLocaleString("en-IL")}
        </p>
      ) : null}
      <BidPanel
        key={`${live.high_bid_agorot ?? 0}-${live.ends_at ?? ""}`}
        listingId={listingId}
        slug={slug}
        status={live.status}
        minNextAgorot={minNextBidAgorot(
          live.starting_bid_agorot,
          live.high_bid_agorot,
          live.bid_increment_agorot,
        )}
        endsAt={live.ends_at}
        startsAt={live.starts_at}
        isOwner={isOwner}
        isLoggedIn={isLoggedIn}
        onPlaced={pull}
      />
    </section>
  );
}

export function AuctionBidHistory() {
  const { live } = useLiveAuction();

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Bid history</h2>
      {live.bids.length === 0 ? (
        <p className="text-sm text-zinc-500">No bids yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {live.bids.map((bid) => (
            <li
              key={bid.id}
              className="flex justify-between border-b border-zinc-100 py-2 dark:border-zinc-800"
            >
              <span>@{bid.bidder?.username ?? "bidder"}</span>
              <span>
                {formatIls(bid.amount_agorot)} ·{" "}
                {new Date(bid.created_at).toLocaleString("en-IL")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
