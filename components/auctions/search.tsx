"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function useDebouncedCallback(callback: (value: string) => void, ms: number) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return (value: string) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => callback(value), ms);
  };
}

export function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = term.trim();
    if (next) {
      params.set("query", next);
    } else {
      params.delete("query");
    }
    const qs = params.toString();
    replace(qs ? `${pathname}?${qs}` : pathname);
  }, 300);

  return (
    <label className="flex w-full max-w-md flex-col gap-1 text-sm">
      <span className="sr-only">Search auctions</span>
      <input
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        type="search"
        name="query"
        placeholder={placeholder}
        defaultValue={searchParams.get("query") ?? ""}
        onChange={(event) => handleSearch(event.target.value)}
      />
    </label>
  );
}
