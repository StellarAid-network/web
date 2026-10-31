import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DEMO_ALICE = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";

test.describe("Day 6: Social Journey (post -> comment -> report) & Profiles", () => {
  test("creates a post, adds a comment, and submits a moderation report", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: "Community feed" })).toBeVisible();

    // 1. Publish a new post
    const uniquePostText = `Borehole solar pump commissioned on-site #water (${Date.now()})`;
    await page.getByTestId("post-composer-input").fill(uniquePostText);
    await page.getByTestId("post-composer-submit").click();

    const createdCard = page.getByTestId("post-card").filter({ hasText: uniquePostText });
    await expect(createdCard).toBeVisible();

    // 2. Open comments on the new post and add a comment
    await createdCard.getByRole("button", { name: /Comments|comment/i }).click();
    const commentText = "Verified pump flow rate at 40L/min!";
    await createdCard.locator('input[data-testid^="comment-input-"]').fill(commentText);
    await createdCard.locator('button[data-testid^="comment-submit-"]').click();

    await expect(createdCard.getByTestId("comment-item")).toContainText(commentText);

    // 3. Report the post through ReportDialog
    await createdCard.locator('button[data-testid^="report-post-"]').click();
    const dialog = page.getByTestId("report-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByTestId("report-category-select").selectOption("spam");
    await dialog
      .getByTestId("report-details-input")
      .fill("Automated E2E moderation report verification check.");
    await dialog.getByTestId("report-submit-button").click();

    await expect(dialog.getByTestId("report-submitted-confirmation")).toBeVisible();
  });

  test("renders public profile with reputation badge, attestations, and follow toggle", async ({
    page,
  }) => {
    await page.goto(`/profile/${DEMO_ALICE}`);
    await expect(page.getByTestId("profile-header-card")).toBeVisible();
    await expect(page.getByTestId("reputation-badge")).toContainText("Reputation");
    await expect(page.getByTestId("attestation-chip").first()).toBeVisible();

    const followBtn = page.getByTestId("follow-toggle-button");
    await expect(followBtn).toBeVisible();
    const beforeLabel = await followBtn.innerText();
    await followBtn.click();
    await expect(followBtn).not.toHaveText(beforeLabel);
  });
});

test.describe("Day 6: WCAG 2.1 AA Accessibility (axe-core)", () => {
  const keyRoutes = [
    "/",
    "/safety",
    "/feed",
    "/giveaways",
    "/requests",
    "/requests/1",
    `/profile/${DEMO_ALICE}`,
  ];

  for (const route of keyRoutes) {
    test(`reports zero serious or critical axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );

      expect(
        seriousOrCritical,
        `Serious/critical a11y violations on ${route}: ${JSON.stringify(
          seriousOrCritical.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
          })),
        )}`,
      ).toEqual([]);
    });
  }
});
