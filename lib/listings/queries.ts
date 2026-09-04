import { createClient } from "@/lib/supabase/server";
import { searchTokens, type BrowseFilters } from "@/lib/listings/search";
import { signedUrlsForPaths } from "@/lib/listings/storage";
import type {
  ListingCardData,
  ListingDetail,
  ListingImage,
} from "@/lib/listings/types";

function highBidFromRows(
  bids: { amount_agorot: number }[] | null | undefined,
) {
  if (!bids?.length) return null;
  return Math.max(...bids.map((b) => b.amount_agorot));
}

async function attachCoverUrls(
  listings: Omit<ListingCardData, "cover_url">[],
): Promise<ListingCardData[]> {
  if (listings.length === 0) return [];

  const supabase = await createClient();
  const ids = listings.map((l) => l.id);
  const { data: images, error } = await supabase
    .from("listing_images")
    .select("listing_id, storage_path, is_cover, sort_order")
    .in("listing_id", ids)
    .order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  const coverPathByListing = new Map<string, string>();
  for (const image of images ?? []) {
    if (coverPathByListing.has(image.listing_id)) continue;
    if (image.is_cover) {
      coverPathByListing.set(image.listing_id, image.storage_path);
    }
  }
  for (const image of images ?? []) {
    if (!coverPathByListing.has(image.listing_id)) {
      coverPathByListing.set(image.listing_id, image.storage_path);
    }
  }

  const urls = await signedUrlsForPaths(
    supabase,
    [...coverPathByListing.values()],
  );

  return listings.map((listing) => {
    const path = coverPathByListing.get(listing.id);
    return {
      ...listing,
      cover_url: path ? (urls.get(path) ?? null) : null,
    };
  });
}

export async function listListingImages(
  listingId: string,
): Promise<ListingImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_images")
    .select("id, storage_path, alt, sort_order, is_cover")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  const urls = await signedUrlsForPaths(
    supabase,
    (data ?? []).map((row) => row.storage_path),
  );

  return (data ?? []).map((row) => ({
    ...row,
    url: urls.get(row.storage_path) ?? null,
  }));
}

function applySearchFilter<
  T extends { or: (filters: string) => T },
>(query: T, raw: string | undefined): T {
  const tokens = searchTokens(raw);
  let next = query;
  for (const token of tokens) {
    const like = `"%${token}%"`;
    const parts = [
      `headline.ilike.${like}`,
      `make.ilike.${like}`,
      `model.ilike.${like}`,
      `trim.ilike.${like}`,
      `location_city.ilike.${like}`,
      `location_region.ilike.${like}`,
    ];
    if (/^\d{2,4}$/.test(token)) {
      parts.push(`year.eq.${Number(token)}`);
    }
    next = next.or(parts.join(","));
  }
  return next;
}

const PUBLIC_STATUSES = [
  "upcoming",
  "live",
  "sold",
  "reserve_not_met",
  "unsold",
] as const;

export async function listPublicMakes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("make")
    .in("status", [...PUBLIC_STATUSES]);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => row.make))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function listPublicListings(
  filters: Partial<BrowseFilters> = {},
): Promise<ListingCardData[]> {
  const parsed: BrowseFilters = {
    query: filters.query ?? "",
    status: filters.status,
    make: filters.make,
    track: filters.track,
  };

  const supabase = await createClient();
  let request = supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      headline,
      year,
      make,
      model,
      status,
      mileage,
      location_city,
      location_region,
      starting_bid_agorot,
      ends_at,
      starts_at,
      sold_price_agorot,
      bids ( amount_agorot )
    `,
    );

  if (parsed.status === "live" || parsed.status === "upcoming") {
    request = request.eq("status", parsed.status);
  } else if (parsed.status === "ended") {
    request = request.in("status", ["sold", "reserve_not_met", "unsold"]);
  } else {
    request = request.in("status", [...PUBLIC_STATUSES]);
  }

  if (parsed.make) {
    request = request.ilike("make", parsed.make);
  }
  if (parsed.track) {
    request = request.eq("track_use", true);
  }

  const { data, error } = await applySearchFilter(request, parsed.query).order(
    "ends_at",
    { ascending: true, nullsFirst: false },
  );

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    headline: row.headline,
    year: row.year,
    make: row.make,
    model: row.model,
    status: row.status,
    mileage: row.mileage,
    location_city: row.location_city,
    location_region: row.location_region,
    starting_bid_agorot: row.starting_bid_agorot,
    ends_at: row.ends_at,
    starts_at: row.starts_at,
    sold_price_agorot: row.sold_price_agorot,
    high_bid_agorot: highBidFromRows(row.bids),
  }));

  return attachCoverUrls(mapped);
}

export async function getListingBySlug(
  slug: string,
): Promise<ListingDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      headline,
      description,
      year,
      make,
      model,
      trim,
      vin,
      status,
      mileage,
      drivetrain,
      transmission,
      gears,
      engine,
      horsepower,
      fuel,
      exterior_color,
      interior_color,
      title_status,
      is_modified,
      modifications_summary,
      service_notes,
      track_use,
      location_city,
      location_region,
      starting_bid_agorot,
      reserve_agorot,
      bid_increment_agorot,
      ends_at,
      starts_at,
      sold_price_agorot,
      seller_id
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const images = await listListingImages(data.id);

  const [{ data: seller }, { data: mods }, { data: bidRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", data.seller_id)
        .maybeSingle(),
      supabase
        .from("listing_modifications")
        .select("id, category, label, sort_order")
        .eq("listing_id", data.id)
        .order("sort_order"),
      supabase
        .from("bids")
        .select("id, amount_agorot, created_at, bidder_id")
        .eq("listing_id", data.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false }),
    ]);

  const bidderIds = [...new Set((bidRows ?? []).map((b) => b.bidder_id))];
  const { data: bidders } =
    bidderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username")
          .in("id", bidderIds)
      : { data: [] as { id: string; username: string }[] };

  const usernameById = new Map(
    (bidders ?? []).map((p) => [p.id, p.username]),
  );

  const bids = (bidRows ?? []).map((bid) => ({
    id: bid.id,
    amount_agorot: bid.amount_agorot,
    created_at: bid.created_at,
    bidder: usernameById.has(bid.bidder_id)
      ? { username: usernameById.get(bid.bidder_id)! }
      : null,
  }));

  return {
    id: data.id,
    slug: data.slug,
    headline: data.headline,
    description: data.description,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
    vin: data.vin,
    status: data.status,
    mileage: data.mileage,
    drivetrain: data.drivetrain,
    transmission: data.transmission,
    gears: data.gears,
    engine: data.engine,
    horsepower: data.horsepower,
    fuel: data.fuel,
    exterior_color: data.exterior_color,
    interior_color: data.interior_color,
    title_status: data.title_status,
    is_modified: data.is_modified,
    modifications_summary: data.modifications_summary,
    service_notes: data.service_notes,
    track_use: data.track_use,
    location_city: data.location_city,
    location_region: data.location_region,
    starting_bid_agorot: data.starting_bid_agorot,
    reserve_agorot: data.reserve_agorot,
    bid_increment_agorot: data.bid_increment_agorot,
    ends_at: data.ends_at,
    starts_at: data.starts_at,
    sold_price_agorot: data.sold_price_agorot,
    high_bid_agorot: highBidFromRows(bids),
    seller_id: data.seller_id,
    seller: seller
      ? { username: seller.username, display_name: seller.display_name }
      : null,
    listing_modifications: mods ?? [],
    bids,
    images,
    cover_url: images.find((img) => img.is_cover)?.url ?? images[0]?.url ?? null,
  };
}

export async function listMyListings(): Promise<ListingCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      headline,
      year,
      make,
      model,
      status,
      mileage,
      location_city,
      location_region,
      starting_bid_agorot,
      ends_at,
      starts_at,
      sold_price_agorot
    `,
    )
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return attachCoverUrls(
    (data ?? []).map((row) => ({
      ...row,
      high_bid_agorot: null,
    })),
  );
}

export type AdminListingRow = {
  id: string;
  slug: string;
  headline: string;
  status: string;
  year: number;
  make: string;
  model: string;
  created_at: string;
};

export async function listAdminListings(): Promise<AdminListingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, headline, status, year, make, model, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function isListingWatched(listingId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("watches")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

export async function listWatchedListings(): Promise<ListingCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("watches")
    .select(
      `
      created_at,
      listings (
        id,
        slug,
        headline,
        year,
        make,
        model,
        status,
        mileage,
        location_city,
        location_region,
        starting_bid_agorot,
        ends_at,
        starts_at,
        sold_price_agorot,
        bids ( amount_agorot )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? [])
    .map((row) => {
      const listing = Array.isArray(row.listings)
        ? row.listings[0]
        : row.listings;
      return listing;
    })
    .filter((listing): listing is NonNullable<typeof listing> =>
      Boolean(listing),
    )
    .map((listing) => ({
      ...listing,
      high_bid_agorot: highBidFromRows(listing.bids),
    }));

  return attachCoverUrls(rows);
}

export async function getEditableListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      status,
      headline,
      description,
      year,
      make,
      model,
      trim,
      vin,
      mileage,
      drivetrain,
      transmission,
      gears,
      engine,
      horsepower,
      fuel,
      exterior_color,
      interior_color,
      title_status,
      is_modified,
      modifications_summary,
      service_notes,
      track_use,
      location_city,
      location_region,
      location_country,
      starting_bid_agorot,
      reserve_agorot,
      bid_increment_agorot,
      starts_at,
      ends_at
    `,
    )
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
