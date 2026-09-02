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
