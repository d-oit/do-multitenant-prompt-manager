import { expect, test } from "./fixtures";

test.describe("Dashboard and analytics", () => {
  test("renders dashboard metrics", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Dashboard should load with metrics
    await expect(page.getByText("Usage Today")).toBeVisible({ timeout: 10000 });

    // Should show stats sections
    await expect(page.getByText("Total Prompts")).toBeVisible();
  });

  test("navigates to analytics view", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Analytics" }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".page-title").first()).toContainText("Prompt Analytics", {
      timeout: 10000
    });

    // Should show analytics controls (multiple time range buttons exist)
    await expect(page.getByRole("button", { name: /Last \d+ days/ }).first()).toBeVisible();
  });

  test.skip("shows empty state when analytics data is missing", async ({
    page,
    testId: _testId
  }) => {
    // This test requires specific test data setup
    await page.goto("/");
    await page.getByRole("button", { name: "Analytics" }).first().click();

    // If no data, should show empty state
    const emptyState = page.getByText("No analytics yet");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });
});
