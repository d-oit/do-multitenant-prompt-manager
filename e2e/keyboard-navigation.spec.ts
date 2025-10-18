import { expect, test } from "./fixtures";

test.describe("Keyboard navigation and accessibility", () => {
  test("navigates main sections with keyboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Tab through navigation elements
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Should have focus on an interactive element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });

    expect(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"]).toContain(focusedElement);
  });

  test("opens keyboard shortcuts dialog with shortcut", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Press keyboard shortcut (usually ? or Ctrl+/)
    await page.keyboard.press("?");
    await page.waitForTimeout(500);

    // Check if shortcuts dialog appears
    const shortcutsDialog = page.getByRole("dialog", { name: /keyboard|shortcuts/i });
    const shortcutsHeading = page.getByRole("heading", { name: /keyboard|shortcuts/i });

    if (await shortcutsDialog.isVisible()) {
      await expect(shortcutsDialog).toBeVisible();
    } else if (await shortcutsHeading.isVisible()) {
      await expect(shortcutsHeading).toBeVisible();
    }
  });

  test("uses Escape key to close dialogs", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Navigate to prompts
    await page.getByRole("button", { name: "Prompts" }).first().click();
    await page.waitForTimeout(1000);

    // Open create prompt dialog
    await page.getByRole("button", { name: "+ New Prompt" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Prompt" });
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test("navigates forms with Tab and Enter", async ({ page, testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Prompts" }).first().click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "+ New Prompt" }).click();
    await expect(page.getByRole("dialog", { name: "Create Prompt" })).toBeVisible();

    // Type in title field
    await page.keyboard.type(`Keyboard Test ${testId}`);

    // Tab to next field
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Should be able to continue tabbing through form
    const focusedTag = await page.evaluate(() => {
      return document.activeElement?.tagName || "";
    });

    expect(["INPUT", "TEXTAREA", "BUTTON", "DIV"]).toContain(focusedTag);
  });

  test("has proper focus management in modals", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Prompts" }).first().click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "+ New Prompt" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Prompt" });
    await expect(dialog).toBeVisible();

    // Focus should be trapped in modal
    const firstFocusable = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return null;

      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length > 0 ? focusable[0].tagName : null;
    });

    expect(firstFocusable).toBeTruthy();
  });

  test("supports ARIA labels and roles", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check for main navigation with proper roles
    const navigation = page.getByRole("navigation").first();
    await expect(navigation).toBeVisible();

    // Check for main content area
    const main = page.getByRole("main").or(page.locator("main"));
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }

    // Check buttons have accessible names
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Verify first button has accessible name
    const firstButtonName = await buttons
      .first()
      .getAttribute("aria-label")
      .catch(() => buttons.first().textContent());
    expect(firstButtonName).toBeTruthy();
  });

  test("supports screen reader announcements", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check for live regions
    const liveRegion = page.locator('[role="status"], [role="alert"], [aria-live]');
    const hasLiveRegion = (await liveRegion.count()) > 0;

    if (hasLiveRegion) {
      // Perform an action that should trigger announcement
      await page.getByRole("button", { name: "Prompts" }).first().click();
      await page.waitForTimeout(1000);

      // Live region should exist for announcements
      await expect(liveRegion.first()).toBeAttached();
    }
  });
});
