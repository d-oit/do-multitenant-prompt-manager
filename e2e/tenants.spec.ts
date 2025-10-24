import { expect, test } from "./fixtures";

test.describe("Tenant management", () => {
  test("creates a new tenant and switches to it", async ({ page, testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Open tenant selector
    const tenantSelector = page.locator(".tenant-selector").first();
    await expect(tenantSelector).toBeVisible();
    await tenantSelector.click();

    // Click add tenant button
    const addButton = page
      .getByRole("button", { name: /Add tenant/i })
      .or(page.getByRole("button", { name: /Create tenant/i }));
    await addButton.click();

    // Fill tenant form
    const tenantName = `E2E Tenant ${testId}`;
    const tenantSlug = `e2e-tenant-${testId}`;

    await page.getByLabel(/Name/i).fill(tenantName);
    await page.getByLabel(/Slug/i).fill(tenantSlug);

    // Submit form
    await page.getByRole("button", { name: /Create/i, exact: false }).click();

    // Wait for success message or tenant to appear
    await page.waitForTimeout(1000);

    // Verify tenant was created by checking if it appears in selector
    await tenantSelector.click();
    await expect(page.getByText(tenantName).first()).toBeVisible({ timeout: 5000 });
  });

  test("shows an error when tenant creation fails", async ({ page, testId }) => {
    await page.route("**/tenants", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await route.fulfill({
          status: 401,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Unauthorized" })
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const tenantSelector = page.locator(".tenant-selector").first();
    await tenantSelector.click();

    const toggle = page.getByRole("button", { name: /Create tenant/i });
    await toggle.click();

    const tenantName = `E2E Failure Tenant ${testId}`;
    const tenantSlug = `e2e-failure-${testId}`;

    await page.getByLabel(/Name/i).fill(tenantName);
    await page.getByLabel(/Slug/i).fill(tenantSlug);

    await page.getByRole("button", { name: /Create/i, exact: false }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Failed to create tenant: Unauthorized" })
    ).toBeVisible();
    await expect(page.locator(".pm-alert--error")).toContainText("Unauthorized");
    await expect(tenantSelector).not.toContainText(tenantName);

    await page.unroute("**/tenants");
  });

  test("switches between tenants", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const tenantSelector = page.locator(".tenant-selector").first();
    await tenantSelector.click();

    // Get list of tenants
    const tenantItems = page.locator(".tenant-selector__item");
    const count = await tenantItems.count();

    if (count > 1) {
      // Switch to second tenant
      await tenantItems.nth(1).click();
      await page.waitForTimeout(1000);

      // Verify prompts page reflects the new tenant
      await page.getByRole("button", { name: "Prompts" }).first().click();
      await page.waitForTimeout(1000);

      // Page should load without errors
      await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();
    }
  });

  test("validates tenant creation with invalid data", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const tenantSelector = page.locator(".tenant-selector").first();
    await tenantSelector.click();

    const addButton = page
      .getByRole("button", { name: /Add tenant/i })
      .or(page.getByRole("button", { name: /Create tenant/i }));
    await addButton.click();

    // Try to submit with empty name
    await page.getByRole("button", { name: /Create/i, exact: false }).click();

    // Should show validation error or prevent submission
    await page.waitForTimeout(500);

    // Form should still be visible (not closed)
    const nameInput = page.getByLabel(/Name/i);
    await expect(nameInput).toBeVisible();
  });
});
