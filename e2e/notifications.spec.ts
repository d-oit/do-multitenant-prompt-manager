import { expect, test } from "./fixtures";

test.describe("Notifications", () => {
  test("displays unread count, refreshes, and marks notifications read", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Notifications" });
    await expect(trigger).toContainText("1");

    await trigger.click();
    const panel = page.locator(".notification-menu__panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".notification-menu__item")).toHaveCount(2);

    const refreshButton = panel.getByRole("button", { name: "Refresh" });
    await refreshButton.click();
    await expect(refreshButton).toHaveText("Loading…");
    await expect(refreshButton).toHaveText("Refresh");

    const unreadItem = panel.locator(".notification-menu__item--unread").first();
    await unreadItem.getByRole("button", { name: "Mark read" }).click();

    await expect(trigger).not.toContainText("1");
    await expect(panel.locator(".notification-menu__item--unread")).toHaveCount(0);
  });
});
