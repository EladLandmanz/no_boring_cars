import { ilsToAgorot, listingSlug } from "@/lib/listings/format";

const DRIVETRAINS = ["fwd", "rwd", "awd", "4wd"] as const;
const TRANSMISSIONS = [
  "manual",
  "automatic",
  "dct",
  "sequential",
  "cvt",
  "other",
] as const;
const TITLES = ["clean", "salvage", "rebuilt", "lemon", "exempt", "other"] as const;
const FUELS = [
  "gasoline",
  "diesel",
  "hybrid",
  "plugin_hybrid",
  "electric",
  "other",
] as const;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v === "" ? null : v;
}

function int(formData: FormData, key: string) {
  const v = str(formData, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function datetime(formData: FormData, key: string) {
  const v = str(formData, key);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseListingForm(formData: FormData) {
  const year = int(formData, "year");
  const mileage = int(formData, "mileage");
  const make = str(formData, "make");
  const model = str(formData, "model");
  const headline = str(formData, "headline");
  const description = str(formData, "description");
  const drivetrain = str(formData, "drivetrain");
  const transmission = str(formData, "transmission");
  const title_status = str(formData, "title_status");
  const fuel = str(formData, "fuel") || "gasoline";
  const location_city = str(formData, "location_city");
  const location_region = str(formData, "location_region");
  const starting = ilsToAgorot(str(formData, "starting_bid_ils"));
  const incrementRaw = str(formData, "bid_increment_ils");
  const increment =
    incrementRaw === "" ? 10000 : ilsToAgorot(incrementRaw);
  const reserveRaw = str(formData, "reserve_ils");
  const reserve = reserveRaw === "" ? null : ilsToAgorot(reserveRaw);

  if (!headline || !description) {
    return { error: "Headline and description are required." } as const;
  }
  if (year == null || year < 1900 || year > 2100) {
    return { error: "Enter a valid year." } as const;
  }
  if (!make || !model) {
    return { error: "Make and model are required." } as const;
  }
  if (mileage == null || mileage < 0) {
    return { error: "Enter mileage in miles (0 or more)." } as const;
  }
  if (!DRIVETRAINS.includes(drivetrain as (typeof DRIVETRAINS)[number])) {
    return { error: "Pick a drivetrain." } as const;
  }
  if (!TRANSMISSIONS.includes(transmission as (typeof TRANSMISSIONS)[number])) {
    return { error: "Pick a transmission." } as const;
  }
  if (!TITLES.includes(title_status as (typeof TITLES)[number])) {
    return { error: "Pick a title status." } as const;
  }
  if (!FUELS.includes(fuel as (typeof FUELS)[number])) {
    return { error: "Pick a fuel type." } as const;
  }
  if (!location_city || !location_region) {
    return { error: "City and region are required." } as const;
  }
  if (starting == null) {
    return { error: "Starting bid must be a positive amount in ₪." } as const;
  }
  if (increment == null) {
    return { error: "Bid increment must be a positive amount in ₪." } as const;
  }
  if (reserveRaw !== "" && reserve == null) {
    return { error: "Reserve must be empty or a positive ₪ amount." } as const;
  }
  if (reserve != null && reserve < starting) {
    return { error: "Reserve cannot be below the starting bid." } as const;
  }

  const starts_at = datetime(formData, "starts_at");
  const ends_at = datetime(formData, "ends_at");
  if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
    return { error: "End time must be after start time." } as const;
  }

  return {
    error: null,
    row: {
      headline,
      description,
      year,
      make,
      model,
      trim: opt(formData, "trim"),
      vin: opt(formData, "vin"),
      mileage,
      drivetrain,
      transmission,
      gears: int(formData, "gears"),
      engine: opt(formData, "engine"),
      horsepower: int(formData, "horsepower"),
      fuel,
      exterior_color: opt(formData, "exterior_color"),
      interior_color: opt(formData, "interior_color"),
      title_status,
      is_modified: formData.get("is_modified") === "on",
      modifications_summary: opt(formData, "modifications_summary"),
      service_notes: opt(formData, "service_notes"),
      track_use: formData.get("track_use") === "on",
      location_city,
      location_region,
      location_country: "IL",
      starting_bid_agorot: starting,
      reserve_agorot: reserve,
      bid_increment_agorot: increment,
      starts_at,
      ends_at,
      original_ends_at: ends_at,
      slug: listingSlug(year, make, model),
    },
  } as const;
}
