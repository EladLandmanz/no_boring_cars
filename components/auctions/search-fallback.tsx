export function SearchFallback({ placeholder }: { placeholder: string }) {
  return (
    <div className="h-10 w-full max-w-md rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="sr-only">{placeholder}</span>
    </div>
  );
}
