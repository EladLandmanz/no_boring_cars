"use client";

import { useActionState } from "react";
import type { ListingFormState } from "@/actions/listings";
import { agorotToIlsInput } from "@/lib/listings/format";
import type { ListingDraft } from "@/lib/listings/types";

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type ListingFormProps = {
  action: (
    prev: ListingFormState,
    formData: FormData,
  ) => Promise<ListingFormState>;
  listing?: ListingDraft;
  submitLabel: string;
};

export function ListingForm({
  action,
  listing,
  submitLabel,
}: ListingFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {listing ? <input type="hidden" name="id" value={listing.id} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Listing</h2>
        <label className="flex flex-col gap-1 text-sm">
          Headline
          <input
            className={inputClass}
            name="headline"
            required
            defaultValue={listing?.headline ?? ""}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            className={`${inputClass} min-h-32`}
            name="description"
            required
            defaultValue={listing?.description ?? ""}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">The car</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Year
            <input
              className={inputClass}
              name="year"
              type="number"
              required
              min={1900}
              max={2100}
              defaultValue={listing?.year ?? 1999}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Make
            <input
              className={inputClass}
              name="make"
              required
              defaultValue={listing?.make ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Model
            <input
              className={inputClass}
              name="model"
              required
              defaultValue={listing?.model ?? ""}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Trim
            <input
              className={inputClass}
              name="trim"
              defaultValue={listing?.trim ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            VIN
            <input
              className={inputClass}
              name="vin"
              defaultValue={listing?.vin ?? ""}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Mileage (miles)
          <input
            className={inputClass}
            name="mileage"
            type="number"
            required
            min={0}
            defaultValue={listing?.mileage ?? 0}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Drivetrain
            <select
              className={inputClass}
              name="drivetrain"
              required
              defaultValue={listing?.drivetrain ?? "rwd"}
            >
              <option value="fwd">FWD</option>
              <option value="rwd">RWD</option>
              <option value="awd">AWD</option>
              <option value="4wd">4WD</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Transmission
            <select
              className={inputClass}
              name="transmission"
              required
              defaultValue={listing?.transmission ?? "manual"}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
              <option value="dct">DCT</option>
              <option value="sequential">Sequential</option>
              <option value="cvt">CVT</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Gears
            <input
              className={inputClass}
              name="gears"
              type="number"
              min={1}
              defaultValue={listing?.gears ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Engine
            <input
              className={inputClass}
              name="engine"
              defaultValue={listing?.engine ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Horsepower
            <input
              className={inputClass}
              name="horsepower"
              type="number"
              min={1}
              defaultValue={listing?.horsepower ?? ""}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Fuel
            <select
              className={inputClass}
              name="fuel"
              defaultValue={listing?.fuel ?? "gasoline"}
            >
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="plugin_hybrid">Plug-in hybrid</option>
              <option value="electric">Electric</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <select
              className={inputClass}
              name="title_status"
              required
              defaultValue={listing?.title_status ?? "clean"}
            >
              <option value="clean">Clean</option>
              <option value="salvage">Salvage</option>
              <option value="rebuilt">Rebuilt</option>
              <option value="lemon">Lemon</option>
              <option value="exempt">Exempt</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Exterior color
            <input
              className={inputClass}
              name="exterior_color"
              defaultValue={listing?.exterior_color ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Interior color
            <input
              className={inputClass}
              name="interior_color"
              defaultValue={listing?.interior_color ?? ""}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="track_use"
            defaultChecked={listing?.track_use ?? false}
          />
          Track use
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_modified"
            defaultChecked={listing?.is_modified ?? false}
          />
          Modified
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Modifications notes
          <textarea
            className={`${inputClass} min-h-20`}
            name="modifications_summary"
            defaultValue={listing?.modifications_summary ?? ""}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Service notes
          <textarea
            className={`${inputClass} min-h-20`}
            name="service_notes"
            defaultValue={listing?.service_notes ?? ""}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            City
            <input
              className={inputClass}
              name="location_city"
              required
              defaultValue={listing?.location_city ?? ""}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Region
            <input
              className={inputClass}
              name="location_region"
              required
              defaultValue={listing?.location_region ?? ""}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Auction (₪)</h2>
        <p className="text-xs text-zinc-500">
          Type whole shekels (or agorot with a decimal). We store agorot in the
          database.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Starting bid
            <input
              className={inputClass}
              name="starting_bid_ils"
              type="number"
              required
              min={1}
              step="0.01"
              defaultValue={
                listing
                  ? agorotToIlsInput(listing.starting_bid_agorot)
                  : "25000"
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Increment
            <input
              className={inputClass}
              name="bid_increment_ils"
              type="number"
              min={1}
              step="0.01"
              defaultValue={
                listing
                  ? agorotToIlsInput(listing.bid_increment_agorot)
                  : "100"
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Reserve (optional)
            <input
              className={inputClass}
              name="reserve_ils"
              type="number"
              min={1}
              step="0.01"
              defaultValue={agorotToIlsInput(listing?.reserve_agorot)}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Starts
            <input
              className={inputClass}
              name="starts_at"
              type="datetime-local"
              defaultValue={toLocalInput(listing?.starts_at ?? null)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Ends
            <input
              className={inputClass}
              name="ends_at"
              type="datetime-local"
              defaultValue={toLocalInput(listing?.ends_at ?? null)}
            />
          </label>
        </div>
      </section>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
