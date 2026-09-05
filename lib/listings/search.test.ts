import { safeNextPath } from "@/lib/auth/safe-next-path";
import {
  auctionsHref,
  parseBrowseFilters,
  searchTokens,
} from "@/lib/listings/search";
import { describe, expect, test } from "vitest";

describe("searchTokens", () => {
  test("splits and caps tokens", () => {
    expect(searchTokens("  mazda  mx5  ")).toEqual(["mazda", "mx5"]);
  });

  test("strips PostgREST metacharacters", () => {
    expect(searchTokens("bmw%_(or)")).toEqual(["bmwor"]);
  });
});

describe("parseBrowseFilters", () => {
  test("reads known status and track flags", () => {
    expect(
      parseBrowseFilters({
        query: "miata",
        status: "live",
        make: "Mazda",
        track: "1",
      }),
    ).toEqual({
      query: "miata",
      status: "live",
      make: "Mazda",
      track: true,
    });
  });

  test("drops unknown status values", () => {
    expect(parseBrowseFilters({ status: "draft" }).status).toBeUndefined();
  });
});

describe("auctionsHref", () => {
  test("builds a query string and can clear a filter", () => {
    expect(
      auctionsHref(
        { query: "", status: "live", track: true },
        { status: null },
      ),
    ).toBe("/auctions?track=1");
  });
});

describe("safeNextPath", () => {
  test("allows same-origin paths only", () => {
    expect(safeNextPath("/auctions", "/")).toBe("/auctions");
    expect(safeNextPath("//evil.test", "/")).toBe("/");
    expect(safeNextPath("https://evil.test", "/")).toBe("/");
  });
});
