import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-24 text-zinc-900 dark:text-zinc-50">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-zinc-500">
        That page or auction does not exist, or it is still a private draft.
      </p>
      <Link href="/auctions" className="text-sm underline">
        Browse auctions
      </Link>
    </div>
  );
}
