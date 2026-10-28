import { test, expect } from "@playwright/test";

// Runs when PLAYWRIGHT_RUN=true (matching existing e2e suite convention)
const run = process.env["PLAYWRIGHT_RUN"] === "true" ? test : test.skip;

run(
  "Journey 1: create -> contribute -> goal failed -> refund",
  async ({ page }) => {
    // 1. Navigate to Create Help Request page
    await page.goto("/requests/create");
    await expect(
      page.getByRole("heading", { name: "Create a Help Request" }),
    ).toBeVisible();

    await page.getByLabel("Request title").fill("Emergency Clinic Oxygen Concentrator");
    await page
      .getByLabel("Detailed description")
      .fill(
        "Purchasing a portable medical oxygen concentrator with community milestone verification.",
      );
    await page.getByLabel(/Total Goal/).fill("200.00");
    await page.getByLabel(/Amount \(USDC\)/).first().fill("200.00");

    await page.getByTestId("submit-create-request").click();

    // 2. Redirected to detail page -> click Contribute
    await expect(page.getByTestId("request-status-badge")).toHaveText("Open");
    await page.getByTestId("contribute-cta-button").click();

    // 3. Contribute partial amount (50.00 USDC < 200.00 USDC goal)
    await expect(page.getByTestId("refund-policy-box")).toBeVisible();
    await page.getByTestId("contribution-amount-input").fill("50.00");
    await expect(page.getByTestId("simulation-ok")).toBeVisible();
    await page.getByTestId("submit-contribution-button").click();

    // 4. Back on detail page -> Simulate Goal Failed -> Claim Refund
    await expect(page.getByTestId("goal-raised")).toContainText("50.00 USDC");
    await page.getByTestId("finalize-failed-button").click();
    await expect(page.getByTestId("request-status-badge")).toHaveText("Failed");

    await page.getByTestId("claim-refund-button").click();
    await expect(page.getByTestId("request-action-banner")).toContainText(
      "Refund claimed successfully",
    );
    await expect(page.getByTestId("refunded-badge")).toBeVisible();
  },
);

run(
  "Journey 2: create -> fund -> milestone -> release",
  async ({ page }) => {
    // 1. Create a 100.00 USDC help request with 1 milestone
    await page.goto("/requests/create");
    await page.getByLabel("Request title").fill("Rural School Solar Reading Lamps");
    await page
      .getByLabel("Detailed description")
      .fill("Funding 40 durable solar LED lamps for evening student study sessions.");
    await page.getByLabel(/Total Goal/).fill("100.00");
    await page.getByLabel(/Amount \(USDC\)/).first().fill("100.00");

    await page.getByTestId("submit-create-request").click();

    // 2. Fund 100% of the goal
    await page.getByTestId("contribute-cta-button").click();
    await page.getByTestId("fund-remaining-button").click();
    await expect(page.getByTestId("simulation-ok")).toBeVisible();
    await page.getByTestId("submit-contribution-button").click();

    // 3. Request is now Funded -> Submit evidence -> Approve -> Release milestone
    await expect(page.getByTestId("request-status-badge")).toHaveText("Funded");

    await page.getByTestId("submit-milestone-0").click();
    await expect(page.getByTestId("request-action-banner")).toContainText(
      "Evidence submitted on-chain",
    );

    await page.getByTestId("approve-milestone-0").click();
    await expect(page.getByTestId("request-action-banner")).toContainText(
      "approved by verifier",
    );

    await page.getByTestId("release-milestone-0").click();
    await expect(page.getByTestId("request-action-banner")).toContainText(
      "Escrow funds released",
    );
    await expect(page.getByTestId("request-status-badge")).toHaveText("Released");
  },
);
