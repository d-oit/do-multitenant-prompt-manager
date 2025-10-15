import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import type { Prompt } from "./utils/mockApi";

const isMac = process.platform === "darwin";
const selectAllShortcut = `${isMac ? "Meta" : "Control"}+A`;

async function openPrompts(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Prompts" }).first().click();
  await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();
}

function buildPrompt(overrides: Partial<Prompt> & { tenantId: string }): Prompt {
  const now = new Date().toISOString();
  return {
    id: `prompt_fixture_${Math.random().toString(16).slice(2)}`,
    title: "Fixture Prompt",
    body: "Fixture prompt body",
    tags: ["fixture"],
    metadata: { source: "fixture" },
    createdAt: now,
    updatedAt: now,
    version: 1,
    archived: false,
    createdBy: "tester",
    ...overrides
  };
}

test.describe("Prompts workflows", () => {
  test("lists prompts with sorting and pagination", async ({ page, apiState }) => {
    const tenantId = apiState.tenants[0].id;
    const basePrompts = apiState.promptsByTenant[tenantId];
    const extraPrompts: Prompt[] = Array.from({ length: 18 }).map((_, index) =>
      buildPrompt({
        tenantId,
        title: `Extra Prompt ${index + 1}`,
        createdAt: new Date(Date.now() - index * 1000 * 60 * 5).toISOString(),
        updatedAt: new Date(Date.now() - index * 1000 * 60 * 4).toISOString(),
        tags: index % 2 ? ["support"] : ["onboarding"],
        metadata: index % 3 === 0 ? { channel: "email" } : null
      })
    );
    apiState.promptsByTenant[tenantId] = [...basePrompts, ...extraPrompts];

    await openPrompts(page);

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(20);

    await page.getByRole("button", { name: /^Title/ }).click();
    await expect(rows.first()).toContainText("Extra Prompt");

    await page.getByRole("button", { name: /^Title/ }).click();
    await expect(rows.first()).toContainText("Acme Prompt 1");

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(".prompt-pagination")).toContainText("Page 2 of");
    await expect(rows.first()).toContainText("Extra Prompt 1");

    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.locator(".prompt-pagination")).toContainText("Page 1 of");
  });

  test("creates a new prompt", async ({ page }) => {
    await openPrompts(page);

    await page.getByRole("button", { name: "+ New Prompt" }).click();
    await expect(page.getByRole("dialog", { name: "Create Prompt" })).toBeVisible();

    await page.getByLabel("Title").fill("Lifecycle welcome prompt");

    const editor = page.locator(".monaco-editor").first();
    await editor.click();
    await page.keyboard.type("Welcome to the lifecycle journey.");

    await page.getByLabel("Tags").fill("onboarding, welcome");
    await page.getByLabel("Metadata (JSON)").fill('{"channel":"email"}');
    await page.getByLabel("Created by").fill("alex");

    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("Prompt created")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Create Prompt" })).toBeHidden();
    await expect(page.getByRole("row", { name: /Lifecycle welcome prompt/ })).toBeVisible();
  });

  test("edits and updates a prompt", async ({ page }) => {
    await openPrompts(page);

    await page.getByRole("row", { name: /Acme Prompt 1/ }).getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Prompt" });
    await expect(dialog).toBeVisible();

    await page.getByLabel("Title").fill("Acme Prompt 1 - Updated");
    const editor = page.locator(".monaco-editor").first();
    await editor.click();
    await page.keyboard.press(selectAllShortcut);
    await page.keyboard.type("Updated body copy for Acme Prompt 1.");
    await page.getByLabel("Tags").fill("support, urgent");
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page.getByText("Prompt updated")).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("row", { name: /Acme Prompt 1 - Updated/ })).toBeVisible();
  });

  test("deletes a prompt", async ({ page }) => {
    await openPrompts(page);

    const targetRow = page.getByRole("row", { name: /Acme Prompt 2/ });
    await targetRow.getByRole("button", { name: "Delete" }).click();

    const confirmDialog = page.getByRole("dialog", { name: "Delete prompt" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText(/Prompt .* deleted/)).toBeVisible();
    await expect(targetRow).toHaveCount(0);
  });

  test("filters prompts by search, tags, and metadata", async ({ page }) => {
    await openPrompts(page);

    const searchInput = page.getByPlaceholder("Search prompts");
    await searchInput.fill("workflow 1");
    await expect(page.getByRole("row", { name: /Acme Prompt 1/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Acme Prompt 3/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Advanced Filters" }).click();
    const filtersPanel = page.locator(".advanced-filters");
    await expect(filtersPanel).toBeVisible();

    await filtersPanel.getByLabel("support").check();
    await filtersPanel.getByRole("button", { name: "Apply Filters" }).click();
    await expect(page.getByRole("row", { name: /Acme Prompt 1/ })).toBeVisible();

    await page.getByRole("button", { name: "Advanced Filters" }).click();
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("channel");
    await filtersPanel.locator("input[placeholder='Value']").fill("voice");
    await filtersPanel.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page.getByText("No results found")).toBeVisible();
    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.getByRole("row", { name: /Acme Prompt 1/ })).toBeVisible();
  });
});
