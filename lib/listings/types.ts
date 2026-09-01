export const PUBLIC_LISTING_STATUSES = [
  "upcoming",
  "live",
  "sold",
  "reserve_not_met",
  "unsold",
] as const;

export type ListingStatus = (typeof PUBLIC_LISTING_STATUSES)[number] | "draft";

export type ListingCardData = {
  id: string;
  slug: string;
  headline: string;
  year: number;
  make: string;
  model: string;
  status: string;
  mileage: number;
  location_city: string;
  location_region: string;
  starting_bid_agorot: number;
  ends_at: string | null;
  starts_at: string | null;
  sold_price_agorot: number | null;
  high_bid_agorot: number | null;
  cover_url: string | null;
};

export type ListingDetail = ListingCardData & {
  description: string;
  trim: string | null;
  vin: string | null;
  drivetrain: string;
  transmission: string;
  gears: number | null;
  engine: string | null;
  horsepower: number | null;
  fuel: string;
  exterior_color: string | null;
  interior_color: string | null;
  title_status: string;
  is_modified: boolean;
  modifications_summary: string | null;
  service_notes: string | null;
  track_use: boolean;
  bid_increment_agorot: number;
  reserve_agorot: number | null;
  seller: { username: string; display_name: string | null } | null;
  seller_id: string;
  listing_modifications: {
    id: string;
    category: string;
    label: string;
    sort_order: number;
  }[];
  bids: {
    id: string;
    amount_agorot: number;
    created_at: string;
    bidder: { username: string } | null;
  }[];
  images: ListingImage[];
};

export type ListingImage = {
  id: string;
  storage_path: string;
  alt: string | null;
  sort_order: number;
  is_cover: boolean;
  url: string | null;
};

export type ListingDraft = {
  id: string;
  slug: string;
  status: string;
  headline: string;
  description: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  vin: string | null;
  mileage: number;
  drivetrain: string;
  transmission: string;
  gears: number | null;
  engine: string | null;
  horsepower: number | null;
  fuel: string;
  exterior_color: string | null;
  interior_color: string | null;
  title_status: string;
  is_modified: boolean;
  modifications_summary: string | null;
  service_notes: string | null;
  track_use: boolean;
  location_city: string;
  location_region: string;
  location_country: string;
  starting_bid_agorot: number;
  reserve_agorot: number | null;
  bid_increment_agorot: number;
  starts_at: string | null;
  ends_at: string | null;
};
