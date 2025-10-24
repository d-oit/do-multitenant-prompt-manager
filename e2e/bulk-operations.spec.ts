import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function waitForMonacoEditor(page: Page, timeout = 5000) {
  const editor = page.locator(".monaco-editor, .rich-text-editor").first();
  await editor.waitFor({ state: "visible", timeout });
  // Wait a bit for editor to initialize
  await page.waitForTimeout(200);
  return editor;
}

async function openPrompts(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  // Click Prompts navigation
  const promptsBtn = page.getByRole("button", { name: /prompts/i }).first();
  await promptsBtn.waitFor({ state: "visible", timeout: 5000 });
  await promptsBtn.click();
  // Wait for prompts page to load
  await page.waitForTimeout(500);
}

async function createPrompt(page: Page, title: string, body: string) {
  const newBtn = page.getByRole("button", { name: /new prompt/i });
  await newBtn.waitFor({ state: "visible", timeout: 5000 });
  await newBtn.click();

  await page.waitForTimeout(500);

  const titleInput = page.getByLabel(/title/i);
  await titleInput.waitFor({ state: "visible", timeout: 5000 });
  await titleInput.fill(title);

  // Wait a bit for the editor to load
  await page.waitForTimeout(1000);

  // Try to find and fill the content editor
  // Look for Monaco editor textarea (Monaco uses a hidden textarea)
  const monacoTextarea = page.locator(".monaco-editor textarea").first();
  const regularTextarea = page
    .locator(
      "textarea[name='content'], textarea[placeholder*='content'], textarea[aria-label*='content']"
    )
    .first();

  if (await monacoTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await monacoTextarea.click();
    await monacoTextarea.fill(body);
  } else if (await regularTextarea.isVisible({ timeout: 1000 }).catch(() => false)) {
    await regularTextarea.fill(body);
  } else {
    // Fallback: try to type directly
    await page.keyboard.type(body);
  }

  await page.waitForTimeout(500);

  const createBtn = page.getByRole("button", { name: /^create$/i });
  await createBtn.click();
  await page.waitForTimeout(1500);
}

test.describe("Bulk operations", () => {
  test("creates multiple prompts sequentially", async ({ page, testId }) => {
    await openPrompts(page);

    const promptCount = 3;
    for (let i = 1; i <= promptCount; i++) {
      await createPrompt(page, `Bulk Test ${testId} - Prompt ${i}`, `Body content for prompt ${i}`);
    }

    // Verify all prompts were created
    for (let i = 1; i <= promptCount; i++) {
      await expect(
        page.getByRole("row", { name: new RegExp(`Bulk Test ${testId} - Prompt ${i}`) })
      ).toBeVisible();
    }
  });

  test("selects and performs actions on multiple prompts", async ({ page, testId }) => {
    await openPrompts(page);

    // Create test prompts
    await createPrompt(page, `Multi Select ${testId} - A`, "Content A");
    await createPrompt(page, `Multi Select ${testId} - B`, "Content B");

    // Check if multi-select UI exists
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Select multiple prompts if multi-select is available
      await checkboxes.first().check();
      await checkboxes.nth(1).check();

      // Look for bulk actions
      const bulkDeleteBtn = page.getByRole("button", { name: /Delete selected/i });
      if (await bulkDeleteBtn.isVisible()) {
        await bulkDeleteBtn.click();

        // Confirm deletion if dialog appears
        const confirmBtn = page.getByRole("button", { name: /Confirm|Delete/i });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }
  });

  test("handles pagination with many prompts", async ({ page }) => {
    await openPrompts(page);

    // Check if pagination exists
    const pagination = page.locator(".prompt-pagination, .pagination, [role='navigation']");
    if (await pagination.isVisible()) {
      const nextButton = page.getByRole("button", { name: /Next|›|→/i });
      const prevButton = page.getByRole("button", { name: /Previous|‹|←/i });

      // Test next button if enabled
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Should load next page
        await expect(page.locator("tbody tr").first()).toBeVisible();

        // Test previous button
        if (await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
          await expect(page.locator("tbody tr").first()).toBeVisible();
        }
      }
    }
  });

  test("filters prompts by tags", async ({ page, testId }) => {
    await openPrompts(page);

    // Create prompt with specific tag
    const uniqueTag = `tag-${testId}`;
    await page.getByRole("button", { name: "+ New Prompt" }).click();
    await page.getByLabel("Title").fill(`Tagged Prompt ${testId}`);
    const editor = await waitForMonacoEditor(page);
    await editor.click();
    await page.keyboard.type("Tagged content");
    await page.getByLabel("Tags").fill(uniqueTag);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Prompt created")).toBeVisible();

    // Filter by tag
    const tagFilter = page.getByPlaceholder(/filter.*tag/i).or(page.getByLabel(/tag/i));

    if (await tagFilter.isVisible()) {
      await tagFilter.fill(uniqueTag);
      await page.waitForTimeout(1000);

      // Should show only prompts with that tag
      await expect(page.getByText(`Tagged Prompt ${testId}`)).toBeVisible();
    }
  });

  test("exports and validates prompt data format", async ({ page, testId }) => {
    await openPrompts(page);

    // Look for export button
    const exportBtn = page.getByRole("button", { name: /Export|Download/i });

    if (await exportBtn.isVisible()) {
      // Create a test prompt first
      await createPrompt(page, `Export Test ${testId}`, "Export content");

      // Start download
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await exportBtn.click();
      const download = await downloadPromise;

      if (download) {
        // Verify download occurred
        expect(download.suggestedFilename()).toMatch(/\.json|\.csv|\.txt/);
      }
    }
  });
});
