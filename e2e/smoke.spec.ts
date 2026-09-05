import { expect, test } from "@playwright/test";

test("home shows the brand and auction sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "No Boring Cars" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /No boring cars/i }),
  ).toBeVisible();
});

test("auctions page can be searched and filtered", async ({ page }) => {
  await page.goto("/auctions");
  await expect(page.getByRole("heading", { name: "Auctions" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search auctions" })).toBeVisible();
  await page.getByRole("link", { name: "Live", exact: true }).click();
  await expect(page).toHaveURL(/status=live/);
});

test("login page is reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});
