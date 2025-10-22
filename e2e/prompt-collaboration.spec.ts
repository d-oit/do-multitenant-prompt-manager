import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function openPrompts(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Prompts" }).first().click();
  await expect(page.getByRole("heading", { name: "Prompts" })).toBeVisible();
}

async function openPromptDetails(page: Page, title = "Acme Prompt 1") {
  await openPrompts(page);
  await page
    .getByRole("row", { name: new RegExp(title) })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: new RegExp(title) });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Prompt collaboration panel", () => {
  test("shows overview with versions and records usage", async ({ page }) => {
    const dialog = await openPromptDetails(page);

    await expect(dialog.getByRole("heading", { name: "Version history" })).toBeVisible();
    await expect(dialog.locator(".prompt-detail__versions li")).toHaveCount(2);

    await dialog.getByRole("button", { name: "Log usage" }).click();
    await expect(page.getByText("Usage recorded")).toBeVisible();

    await dialog.getByRole("button", { name: "Refresh versions" }).click();
    await expect(dialog.locator(".prompt-detail__versions li")).toHaveCount(2);
  });

  test("supports threaded comments with reply, resolve, and delete", async ({ page }) => {
    const dialog = await openPromptDetails(page);

    await dialog.getByRole("button", { name: "Comments" }).click();
    const commentsList = dialog.locator(".prompt-comments__list").first();
    await expect(commentsList.getByText("This prompt looks great!")).toBeVisible();

    const composer = dialog.getByPlaceholder("Share feedback or ask a question");
    await composer.fill("New comment from e2e test");
    await dialog.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByText("Comments updated")).toBeVisible();
    const newComment = commentsList.locator(".prompt-comments__item", {
      hasText: "New comment from e2e test"
    });
    await expect(newComment).toBeVisible();

    const firstComment = commentsList.locator(".prompt-comments__item").first();
    await firstComment.getByRole("button", { name: "Resolve" }).click();
    await expect(firstComment.getByText("Resolved")).toBeVisible();

    await newComment.getByRole("button", { name: "Delete" }).click();
    await expect(newComment).toHaveCount(0);
  });

  test("manages prompt sharing targets", async ({ page }) => {
    const dialog = await openPromptDetails(page);

    await dialog.getByRole("button", { name: "Sharing" }).click();
    await expect(dialog.locator(".prompt-share__item")).toHaveCount(1);

    const shareForm = dialog.locator(".prompt-share__form");
    await shareForm.locator("select").first().selectOption("email");
    await shareForm.getByPlaceholder("user@example.com").fill("reviewer@example.com");
    await shareForm.locator("select").nth(1).selectOption("approver");
    await shareForm.locator("input[type='date']").fill("2025-01-01");
    await shareForm.getByRole("button", { name: "Share" }).click();
    await expect(page.getByText("Shares updated")).toBeVisible();

    const shareItems = dialog.locator(".prompt-share__item");
    await expect(shareItems).toHaveCount(2);
    await shareItems
      .filter({ hasText: "reviewer@example.com" })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(shareItems.filter({ hasText: "reviewer@example.com" })).toHaveCount(0);
  });

  test("requests approvals and updates status", async ({ page }) => {
    const dialog = await openPromptDetails(page);

    await dialog.getByRole("button", { name: "Approvals" }).click();
    const approvalsList = dialog.locator(".prompt-approvals__item");
    await expect(approvalsList).toHaveCount(1);

    await dialog.getByPlaceholder("Approver email or ID").fill("owner@example.com");
    await dialog.getByPlaceholder("Optional message").fill("Please approve ASAP");
    await dialog.getByRole("button", { name: "Request approval" }).click();
    await expect(page.getByText("Approvals updated")).toBeVisible();
    await expect(approvalsList).toHaveCount(2);

    const firstApproval = approvalsList.first();
    await firstApproval.getByRole("button", { name: "Approve" }).click();
    await expect(firstApproval.getByText(/approved/i)).toBeVisible();
  });

  test("displays activity feed and refreshes entries", async ({ page }) => {
    const dialog = await openPromptDetails(page);

    await dialog.getByRole("button", { name: "Activity" }).click();
    const activityList = dialog.locator(".prompt-activity__list li");
    await expect(activityList).toHaveCount(2);

    await dialog.getByRole("button", { name: "Refresh" }).click();
    await expect(page.getByText("Activity updated")).toBeVisible();
  });
});
