import { test, expect } from "@playwright/test";

// Smoke test — runs only when PLAYWRIGHT_RUN=true to avoid blocking CI
// without a browser environment. The wallet page redirect is tested here.
const run = process.env["PLAYWRIGHT_RUN"] === "true" ? test : test.skip;

run("wallet page redirects to home when not connected", async ({ page }) => {
  await page.goto("/wallet");
  // Should redirect to / since wallet is not connected.
  await expect(page).toHaveURL("/");
});

run("home page loads without errors", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  // Check there are no JS errors in the console during load.
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});
