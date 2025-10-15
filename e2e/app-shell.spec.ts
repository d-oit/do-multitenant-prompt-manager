import { expect, test } from "./fixtures";

test.describe("App shell", () => {
  test("renders app and navigates between primary views", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole("heading", { name: /DO Multi-Tenant Prompt Manager/i })
    ).toBeVisible();

    // Test navigation
    await page.getByRole("button", { name: "Prompts" }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible({
      timeout: 10000
    });

    await page.getByRole("button", { name: "Analytics" }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "Prompt Analytics" }).first()).toBeVisible({
      timeout: 10000
    });

    await page.getByRole("button", { name: "Tenants" }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "Tenants" }).first()).toBeVisible({
      timeout: 10000
    });

    await page.getByRole("button", { name: "Dashboard" }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".page-title").first()).toContainText("overview", { timeout: 10000 });
  });

  test("creates a tenant from the sidebar form", async ({ page, testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const createToggle = page.locator("summary", { hasText: "Create tenant" });
    await createToggle.click();

    const tenantName = `E2E Tenant ${testId}`;
    const tenantSlug = `e2e-tenant-${testId}`;

    await page.getByLabel("Name").fill(tenantName);
    await page.getByLabel("Slug").fill(tenantSlug);
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText(/Tenant .* created/)).toBeVisible();

    // Should auto-select the new tenant
    const tenantSelect = page.getByLabel("Tenant");
    await expect(tenantSelect).toContainText(tenantName);
  });

  test("shows install prompt and toggles dark mode", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt") as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
        preventDefault: () => void;
      };
      event.prompt = async () => {};
      event.userChoice = Promise.resolve({ outcome: "accepted", platform: "test" });
      event.preventDefault = () => {};
      window.dispatchEvent(event);
    });

    const installButton = page.getByRole("button", { name: "Install app" });
    await expect(installButton).toBeVisible();
    await installButton.click();
    await expect(installButton).toBeHidden();
    await expect(page.getByText("App install prompt shown")).toBeVisible();

    const toggle = page.locator(".dark-mode-toggle__button");
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await toggle.click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  });

  test("opens keyboard shortcuts reference from sidebar", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "View all shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Navigation")).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(dialog).toBeHidden();
  });
});
