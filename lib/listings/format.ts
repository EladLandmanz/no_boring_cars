export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function listingSlug(year: number, make: string, model: string) {
  const base = [year, slugify(make), slugify(model)].filter(Boolean).join("-");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "listing"}-${suffix}`;
}

/** UI talks in ILS; Postgres stores agorot. */
export function ilsToAgorot(raw: string) {
  const n = Number(String(raw).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function agorotToIlsInput(agorot: number | null | undefined) {
  if (agorot == null) return "";
  return String(agorot / 100);
}
