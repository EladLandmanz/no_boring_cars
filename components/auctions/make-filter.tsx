"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MakeFilter({
  makes,
  selected,
}: {
  makes: string[];
  selected?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Make</span>
      <select
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        name="make"
        value={selected ?? ""}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          const next = event.target.value;
          if (next) params.set("make", next);
          else params.delete("make");
          const qs = params.toString();
          replace(qs ? `${pathname}?${qs}` : pathname);
        }}
      >
        <option value="">All</option>
        {makes.map((make) => (
          <option key={make} value={make}>
            {make}
          </option>
        ))}
      </select>
    </label>
  );
}
