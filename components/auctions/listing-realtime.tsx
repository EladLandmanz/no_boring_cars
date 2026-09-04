"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ListingRealtime({
  listingId,
  enabled,
}: {
  listingId: string;
  enabled: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        router.refresh();
      }, 50);
    };

    const channel = supabase
      .channel(`listing:${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `listing_id=eq.${listingId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listingId}`,
        },
        refresh,
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [enabled, listingId, router]);

  return null;
}
