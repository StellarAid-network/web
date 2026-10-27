import { test, expect } from "@playwright/test";

// E2E smoke test for giveaway claim page
const run = process.env["PLAYWRIGHT_RUN"] === "true" ? test : test.skip;

run("giveaway claim page renders summary and bot protection", async ({ page }) => {
  await page.goto("/giveaways/test-giveaway-1/claim");
  await expect(page.getByRole("heading", { name: "Claim Giveaway" })).toBeVisible();
  await expect(page.getByText("Bot Protection & Sybil Verification")).toBeVisible();
});
