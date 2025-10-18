import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const isMac = process.platform === "darwin";
const selectAllShortcut = `${isMac ? "Meta" : "Control"}+A`;

async function waitForMonacoEditor(page: Page, timeout = 30000) {
  // Wait for Monaco editor to be visible and interactive
  const editor = page.locator(".monaco-editor").first();
  await editor.waitFor({ state: "visible", timeout });

  // Wait for editor to be fully initialized (has textarea)
  await page.locator(".monaco-editor textarea").first().waitFor({ state: "attached", timeout });

  // Small delay to ensure editor is interactive
  await page.waitForTimeout(500);

  return editor;
}

async function openPrompts(page: Page) {
  await page.goto("/");

  // Wait for the app to load and tenants to be fetched
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Click Prompts button and wait for navigation
  await page.getByRole("button", { name: "Prompts" }).first().click();
  await page.waitForTimeout(1000);

  // Wait for the Prompts page to load
  await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible({
    timeout: 10000
  });
}

test.describe("Prompts workflows", () => {
  test("lists prompts with sorting and pagination", async ({ page, testId: _testId }) => {
    await openPrompts(page);

    const rows = page.locator("tbody tr");

    // Check if any prompts exist
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Test sorting if prompts exist
      await page.getByRole("button", { name: /Title/ }).first().click();
      await page.waitForTimeout(500);

      // Test pagination if enough prompts exist
      const pagination = page.locator(".prompt-pagination");
      if (await pagination.isVisible()) {
        const nextButton = page.getByRole("button", { name: "Next" });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(500);
          await page.getByRole("button", { name: "Previous" }).click();
        }
      }
    }
  });

  test("creates a new prompt", async ({ page, testId }) => {
    await openPrompts(page);

    await page.getByRole("button", { name: "+ New Prompt" }).click();
    await expect(page.getByRole("dialog", { name: "Create Prompt" })).toBeVisible();

    const promptTitle = `E2E Test Prompt ${testId}`;
    await page.getByLabel("Title").fill(promptTitle);

    const editor = await waitForMonacoEditor(page);
    await editor.click();
    await page.keyboard.type("Welcome to the e2e test lifecycle.");

    await page.getByLabel("Tags").fill("e2e, test");
    await page.getByLabel("Metadata (JSON)").fill(`{"testId":"${testId}"}`);
    await page.getByLabel("Created by").fill("e2e-tester");

    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("Prompt created")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Create Prompt" })).toBeHidden();
    await expect(page.getByRole("row", { name: new RegExp(promptTitle) })).toBeVisible();
  });

  test("edits and updates a prompt", async ({ page, testId }) => {
    // First create a prompt to edit
    await openPrompts(page);
    await page.getByRole("button", { name: "+ New Prompt" }).click();
    const promptTitle = `E2E Edit Test ${testId}`;
    await page.getByLabel("Title").fill(promptTitle);
    const editor = await waitForMonacoEditor(page);
    await editor.click();
    await page.keyboard.type("Original prompt body");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Prompt created")).toBeVisible();

    // Now edit it
    const targetRow = page.getByRole("row", { name: new RegExp(promptTitle) });
    await targetRow.getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Prompt" });
    await expect(dialog).toBeVisible();

    await page.getByLabel("Title").fill(`${promptTitle} - Updated`);
    const editorUpdate = await waitForMonacoEditor(page);
    await editorUpdate.click();
    await page.keyboard.press(selectAllShortcut);
    await page.keyboard.type("Updated prompt body");
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page.getByText("Prompt updated")).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("row", { name: new RegExp(`${promptTitle} - Updated`) })
    ).toBeVisible();
  });

  test("deletes a prompt", async ({ page, testId }) => {
    // First create a prompt to delete
    await openPrompts(page);
    await page.getByRole("button", { name: "+ New Prompt" }).click();
    const promptTitle = `E2E Delete Test ${testId}`;
    await page.getByLabel("Title").fill(promptTitle);
    const editor = await waitForMonacoEditor(page);
    await editor.click();
    await page.keyboard.type("Prompt to be deleted");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Prompt created")).toBeVisible();

    // Now delete it
    const targetRow = page.getByRole("row", { name: new RegExp(promptTitle) });
    await targetRow.getByRole("button", { name: "Delete" }).click();

    const confirmDialog = page.getByRole("dialog", { name: "Delete prompt" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText(/Prompt .* deleted/)).toBeVisible();
    await expect(targetRow).toHaveCount(0);
  });

  test("filters prompts by search", async ({ page, testId }) => {
    // Create a searchable prompt
    await openPrompts(page);
    await page.getByRole("button", { name: "+ New Prompt" }).click();
    const uniqueKeyword = `search${testId}`;
    await page.getByLabel("Title").fill(`Prompt with ${uniqueKeyword}`);
    const editor = await waitForMonacoEditor(page);
    await editor.click();
    await page.keyboard.type("Test search functionality");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Prompt created")).toBeVisible();

    // Test search
    const searchInput = page.getByPlaceholder("Search prompts");
    await searchInput.fill(uniqueKeyword);
    await page.waitForTimeout(1000);

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(rows.first()).toContainText(uniqueKeyword);
  });
});
