const TOKEN_MAX = 5;

/** Strip PostgREST or() metacharacters so a typed query cannot change the filter shape. */
export function searchTokens(query: string | null | undefined): string[] {
  if (!query) return [];
  return query
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[%_,.()"\\*]/g, ""))
    .filter((part) => part.length > 0)
    .slice(0, TOKEN_MAX);
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export const BROWSE_STATUSES = ["live", "upcoming", "ended"] as const;

export type BrowseStatus = (typeof BROWSE_STATUSES)[number];

export type BrowseFilters = {
  query: string;
  status?: BrowseStatus;
  make?: string;
  track?: boolean;
};

export type AuctionSearchParams = {
  query?: string | string[];
  status?: string | string[];
  make?: string | string[];
  track?: string | string[];
};

export function parseBrowseFilters(
  params: AuctionSearchParams,
): BrowseFilters {
  const query = firstSearchParam(params.query).trim();
  const statusRaw = firstSearchParam(params.status);
  const status = (BROWSE_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as BrowseStatus)
    : undefined;
  const make = firstSearchParam(params.make)
    .replace(/[%_,.()"\\*]/g, "")
    .trim()
    .slice(0, 40);
  return {
    query,
    status,
    make: make || undefined,
    track: firstSearchParam(params.track) === "1" || undefined,
  };
}

export function browseCacheKey(filters: BrowseFilters) {
  return [
    filters.query,
    filters.status ?? "",
    filters.make ?? "",
    filters.track ? "1" : "",
  ].join("|");
}

export function auctionsHref(
  filters: BrowseFilters,
  patch: Partial<Record<"query" | "status" | "make" | "track", string | null>>,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.make) params.set("make", filters.make);
  if (filters.track) params.set("track", "1");

  for (const [key, value] of Object.entries(patch)) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }

  const qs = params.toString();
  return qs ? `/auctions?${qs}` : "/auctions";
}
