import { expect, test } from "./fixtures";

test.describe("Dashboard and analytics", () => {
  test("renders dashboard metrics after retry", async ({ page, apiState }) => {
    const tenantId = apiState.tenants[0].id;
    apiState.failures.dashboard = { [tenantId]: 1 };

    await page.goto("/");

    await expect(page.getByText("Something went wrong")).toBeVisible();
    await page.getByRole("button", { name: "Try Again" }).click();

    await expect(page.getByText("Usage Today")).toBeVisible();
    await expect(page.getByText("42")).toBeVisible();
    await expect(page.getByText("Acme Prompt 1")).toBeVisible();
  });

  test("toggles analytics ranges and updates table", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Analytics" }).first().click();
    await expect(page.getByRole("heading", { name: "Prompt Analytics" })).toBeVisible();

    const tableRows = page.locator("table tbody tr");
    await expect(tableRows).toHaveCount(8);

    await page.getByRole("button", { name: "Last 7 days" }).click();
    await expect(tableRows).toHaveCount(3);

    await page.getByRole("button", { name: "Last 14 days" }).click();
    await expect(tableRows).toHaveCount(5);
  });

  test("shows empty state when analytics data is missing", async ({ page, apiState }) => {
    const tenant = apiState.tenants[1];
    const ranges = apiState.analytics[tenant.id];
    Object.keys(ranges).forEach((range) => {
      ranges[Number(range)].data = [];
    });

    await page.goto("/");
    await page.getByLabel("Tenant").selectOption(tenant.id);
    await page.getByRole("button", { name: "Analytics" }).first().click();

    await expect(page.getByText("No analytics yet")).toBeVisible();
  });
});
