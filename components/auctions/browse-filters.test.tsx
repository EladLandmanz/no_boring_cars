import { render, screen } from "@testing-library/react";
import { BrowseFiltersBar } from "@/components/auctions/browse-filters";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/auctions",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

test("marks the active status chip and links Live to the live filter", () => {
  render(
    <BrowseFiltersBar
      filters={{ query: "", status: "live" }}
      makes={["Mazda"]}
    />,
  );

  const live = screen.getByRole("link", { name: "Live" });
  expect(live).toHaveAttribute("href", "/auctions?status=live");
  expect(live.className).toContain("bg-brand");

  expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
    "href",
    "/auctions",
  );
});
