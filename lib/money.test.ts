import { currentPriceAgorot, minNextBidAgorot } from "@/lib/money";
import { ilsToAgorot, agorotToIlsInput, slugify } from "@/lib/listings/format";
import { describe, expect, test } from "vitest";

describe("currentPriceAgorot", () => {
  test("uses starting bid when nobody has bid", () => {
    expect(currentPriceAgorot(2_500_000, null)).toBe(2_500_000);
  });

  test("uses the high bid when one exists", () => {
    expect(currentPriceAgorot(2_500_000, 3_000_000)).toBe(3_000_000);
  });
});

describe("minNextBidAgorot", () => {
  test("first bid can equal the starting price", () => {
    expect(minNextBidAgorot(2_500_000, null, 10_000)).toBe(2_500_000);
  });

  test("later bids add the increment", () => {
    expect(minNextBidAgorot(2_500_000, 3_000_000, 10_000)).toBe(3_010_000);
  });
});

describe("ilsToAgorot", () => {
  test("converts shekels to integer agorot", () => {
    expect(ilsToAgorot("25000")).toBe(2_500_000);
    expect(ilsToAgorot("25,000.50")).toBe(2_500_050);
  });

  test("rejects empty or non-positive amounts", () => {
    expect(ilsToAgorot("")).toBeNull();
    expect(ilsToAgorot("0")).toBeNull();
    expect(ilsToAgorot("-10")).toBeNull();
  });
});

describe("agorotToIlsInput", () => {
  test("turns stored agorot back into a form value", () => {
    expect(agorotToIlsInput(2_500_000)).toBe("25000");
    expect(agorotToIlsInput(null)).toBe("");
  });
});

describe("slugify", () => {
  test("normalizes a make/model for URLs", () => {
    expect(slugify("MX-5 Miata")).toBe("mx-5-miata");
  });
});
