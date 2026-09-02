import Link from "next/link";
import { MakeFilter } from "@/components/auctions/make-filter";
import { auctionsHref, type BrowseFilters } from "@/lib/listings/search";

const STATUS_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

export function BrowseFiltersBar({
  filters,
  makes,
}: {
  filters: BrowseFilters;
  makes: string[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <nav className="flex flex-wrap gap-2" aria-label="Auction status">
        {STATUS_OPTIONS.map((option) => {
          const active = (filters.status ?? null) === option.value;
          return (
            <Link
              key={option.label}
              href={auctionsHref(filters, { status: option.value })}
              className={
                active
                  ? "rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1 text-sm text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "rounded-full border border-zinc-300 px-3 py-1 text-sm hover:border-zinc-500 dark:border-zinc-700"
              }
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
      <MakeFilter makes={makes} selected={filters.make} />
      <Link
        href={auctionsHref(filters, { track: filters.track ? null : "1" })}
        className={
          filters.track
            ? "rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1 text-sm text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "rounded-full border border-zinc-300 px-3 py-1 text-sm hover:border-zinc-500 dark:border-zinc-700"
        }
      >
        Track cars
      </Link>
    </div>
  );
}
