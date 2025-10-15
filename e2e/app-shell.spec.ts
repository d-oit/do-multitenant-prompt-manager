import { expect, test } from "./fixtures";

test.describe("App shell", () => {
  test("renders tenants and navigates between primary views", async ({ page, apiState }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /DO Multi-Tenant Prompt Manager/i })).toBeVisible();

    const tenantSelect = page.getByLabel("Tenant");
    await expect(tenantSelect).toHaveValue(apiState.tenants[0].id);

    await tenantSelect.selectOption(apiState.tenants[1].id);
    await expect(tenantSelect).toHaveValue(apiState.tenants[1].id);

    await page.getByRole("button", { name: "Prompts" }).first().click();
    await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Analytics" }).first().click();
    await expect(page.getByRole("heading", { name: "Prompt Analytics" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Tenants" }).first().click();
    await expect(page.getByRole("heading", { name: "Tenants" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Dashboard" }).first().click();
    await expect(page.locator(".page-title").first()).toContainText("overview");
  });

  test("creates a tenant from the sidebar form", async ({ page, apiState }) => {
    await page.goto("/");

    const initialCount = apiState.tenants.length;
    const createToggle = page.locator("summary", { hasText: "Create tenant" });
    await createToggle.click();

    await page.getByLabel("Name").fill("Delta Co");
    await page.getByLabel("Slug").fill("delta-co");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText(/Tenant .* created/)).toBeVisible();
    expect(apiState.tenants).toHaveLength(initialCount + 1);

    const newlyCreated = apiState.tenants[apiState.tenants.length - 1];
    await expect(page.getByLabel("Tenant")).toHaveValue(newlyCreated.id);
    await expect(page.getByLabel("Tenant")).toContainText(newlyCreated.name);
  });

  test("shows install prompt and toggles dark mode", async ({ page }) => {
    await page.goto("/");

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

  test("opens keyboard shortcuts reference from sidebar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "View all shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Navigation")).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(dialog).toBeHidden();
  });
});
