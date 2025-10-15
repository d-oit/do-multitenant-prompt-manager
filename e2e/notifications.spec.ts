import { expect, test } from "./fixtures";

test.describe("Notifications", () => {
  test("displays notification panel and refresh button", async ({ page, testId: _testId }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const trigger = page.getByRole("button", { name: "Notifications" });
    await trigger.click();

    const panel = page.locator(".notification-menu__panel");
    await expect(panel).toBeVisible({ timeout: 10000 });

    const refreshButton = panel.getByRole("button", { name: "Refresh" });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // API responds quickly in local mode, so we may not see "Loading…"
    // Just verify refresh completes
    await page.waitForTimeout(1000);
    await expect(refreshButton).toHaveText("Refresh");

    // If there are unread notifications, test marking as read
    const unreadItems = panel.locator(".notification-menu__item--unread");
    const unreadCount = await unreadItems.count();
    if (unreadCount > 0) {
      await unreadItems.first().getByRole("button", { name: "Mark read" }).click();
      await page.waitForTimeout(500);
      const newUnreadCount = await unreadItems.count();
      expect(newUnreadCount).toBeLessThan(unreadCount);
    }
  });
});
