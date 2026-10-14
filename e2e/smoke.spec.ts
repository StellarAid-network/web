import { expect, test } from "@playwright/test";

test("landing page renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("mutual aid");
});

test("navigates from landing to the feed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore the community" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.getByRole("heading", { name: "Community feed" })).toBeVisible();
});
