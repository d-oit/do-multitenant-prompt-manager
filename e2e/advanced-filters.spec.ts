import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function openPrompts(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Prompts" }).first().click();
  await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();
}

async function openAdvancedFilters(page: Page) {
  await page.getByRole("button", { name: "Advanced Filters" }).click();
  const filtersPanel = page.locator(".advanced-filters");
  await expect(filtersPanel).toBeVisible();
  return filtersPanel;
}

async function applyFilters(page: Page) {
  const filtersPanel = page.locator(".advanced-filters");
  await filtersPanel.getByRole("button", { name: "Apply Filters" }).click();
  // Wait for the filters panel to close
  await expect(filtersPanel).toBeHidden();
}

async function resetFilters(page: Page) {
  const filtersPanel = page.locator(".advanced-filters");
  await filtersPanel.getByRole("button", { name: "Reset" }).click();
}

test.describe("Enhanced Advanced Search Filters", () => {
  test("filters by multiple tags with AND logic", async ({ page }) => {
    await openPrompts(page);

    // Should start with all active prompts visible (7 out of 8, since 1 is archived)
    await expect(page.locator("tbody tr")).toHaveCount(7);

    const filtersPanel = await openAdvancedFilters(page);

    // Select "urgent" and "production" tags
    await filtersPanel.getByLabel("urgent").check();
    await filtersPanel.getByLabel("production").check();
    await applyFilters(page);

    // Should show only prompts that have BOTH urgent AND production tags
    // Based on test data: "Production API Alert System" and "Urgent Production Fix"
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect(page.getByRole("row", { name: /Production API Alert System/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Urgent Production Fix/ })).toBeVisible();
  });

  test("filters by advanced metadata with equals operator", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Add metadata filter: priority equals "high"
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("priority");
    await filtersPanel.locator("select").selectOption("equals");
    await filtersPanel.locator("input[placeholder='Value']").fill("high");
    await applyFilters(page);

    // Should show prompts with priority: "high"
    // Based on test data: "Production API Alert System" and "Production API Documentation"
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect(page.getByRole("row", { name: /Production API Alert System/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Production API Documentation/ })).toBeVisible();
  });

  test("filters by advanced metadata with contains operator", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Add metadata filter: department contains "engineer"
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("department");
    await filtersPanel.locator("select").selectOption("contains");
    await filtersPanel.locator("input[placeholder='Value']").fill("engineer");
    await applyFilters(page);

    // Should show prompts where department contains "engineer"
    // Based on test data: should match "engineering" department
    await expect(page.locator("tbody tr")).toHaveCount(4);
    await expect(page.getByRole("row", { name: /Production API Alert System/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Development Debug Helper/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Production API Documentation/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Urgent Production Fix/ })).toBeVisible();
  });

  test("filters by advanced metadata with not_equals operator", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Add metadata filter: priority not equals "low"
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("priority");
    await filtersPanel.locator("select").selectOption("not_equals");
    await filtersPanel.locator("input[placeholder='Value']").fill("low");
    await applyFilters(page);

    // Should exclude prompts with priority: "low"
    // Should not show "Marketing Campaign Template"
    await expect(page.locator("tbody tr")).toHaveCount(6);
    await expect(page.getByRole("row", { name: /Marketing Campaign Template/ })).toHaveCount(0);
  });

  test("filters by archived status - active only", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Select "Active" status (this should be the default, but let's be explicit)
    await filtersPanel.getByLabel("Active").check();
    await applyFilters(page);

    // Should show only active prompts (exclude archived)
    await expect(page.locator("tbody tr")).toHaveCount(7);
    await expect(page.getByRole("row", { name: /Legacy Script - Deprecated/ })).toHaveCount(0);
  });

  test("filters by archived status - archived only", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Select "Archived" status
    await filtersPanel.getByLabel("Archived").check();
    await applyFilters(page);

    // Should show only archived prompts
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("row", { name: /Legacy Script - Deprecated/ })).toBeVisible();
  });

  test("filters by creator with partial matching", async ({ page }) => {
    await openPrompts(page);

    await openAdvancedFilters(page);

    // Search for creator containing "john"
    // Note: We need to add a creator field to the advanced filters UI
    // For now, let's test this through the API by adding the field
    await page.evaluate(() => {
      // Add creator field to the form for testing
      const filtersForm = document.querySelector(".advanced-filters__content");
      if (filtersForm) {
        const creatorField = document.createElement("div");
        creatorField.className = "pm-field";
        creatorField.innerHTML = `
          <label class="pm-field__label" for="creator-filter">Created by:</label>
          <input id="creator-filter" type="text" class="pm-input input-sm" placeholder="Creator name" />
        `;
        filtersForm.appendChild(creatorField);
      }
    });

    await page.locator("#creator-filter").fill("john");
    await applyFilters(page);

    // Should show prompts created by users with "john" in their name
    // Based on test data: john.doe@acme.com and john.analytics@acme.com
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(page.getByRole("row", { name: /Production API Alert System/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Production API Documentation/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Analytics Dashboard Helper/ })).toBeVisible();
  });

  test("filters by date range", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Set date range to recent dates (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();

    await filtersPanel
      .locator("#advanced-filters-date-from")
      .fill(sevenDaysAgo.toISOString().split("T")[0]);
    await filtersPanel.locator("#advanced-filters-date-to").fill(today.toISOString().split("T")[0]);
    await applyFilters(page);

    // Should show only recent prompts (all except the legacy one which is 30 days old)
    await expect(page.locator("tbody tr")).toHaveCount(7);
    await expect(page.getByRole("row", { name: /Legacy Script - Deprecated/ })).toHaveCount(0);
  });

  test("combines multiple filters correctly", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Combine multiple filters:
    // 1. Tags: "urgent" AND "production"
    // 2. Metadata: priority = "high"
    // 3. Status: Active

    // Select multiple tags
    await filtersPanel.getByLabel("urgent").check();
    await filtersPanel.getByLabel("production").check();

    // Add metadata filter
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("priority");
    await filtersPanel.locator("select").selectOption("equals");
    await filtersPanel.locator("input[placeholder='Value']").fill("high");

    // Ensure active status
    await filtersPanel.getByLabel("Active").check();

    await applyFilters(page);

    // Should show only "Production API Alert System" which matches all criteria
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("row", { name: /Production API Alert System/ })).toBeVisible();
  });

  test("resets all filters correctly", async ({ page }) => {
    await openPrompts(page);

    // Apply some filters first
    const filtersPanel = await openAdvancedFilters(page);
    await filtersPanel.getByLabel("urgent").check();
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("priority");
    await filtersPanel.locator("input[placeholder='Value']").fill("high");
    await applyFilters(page);

    // Verify filters are applied
    await expect(page.locator("tbody tr")).toHaveCount(3); // Should be filtered

    // Reset filters
    await openAdvancedFilters(page);
    await resetFilters(page);
    await applyFilters(page);

    // Should show all active prompts again
    await expect(page.locator("tbody tr")).toHaveCount(7);
  });

  test("shows no results message when filters match nothing", async ({ page }) => {
    await openPrompts(page);

    const filtersPanel = await openAdvancedFilters(page);

    // Apply filters that won't match anything
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("nonexistent");
    await filtersPanel.locator("input[placeholder='Value']").fill("impossible");
    await applyFilters(page);

    // Should show no results message
    await expect(page.getByText("No results found")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(0);
  });

  test("preserves filters when navigating between pages", async ({ page }) => {
    await openPrompts(page);

    // Apply a filter
    const filtersPanel = await openAdvancedFilters(page);
    await filtersPanel.getByLabel("urgent").check();
    await applyFilters(page);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(7); // Should be filtered

    // Navigate to another page and back
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("button", { name: "Prompts" }).click();
    await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();

    // Filters should be preserved
    await expect(page.locator("tbody tr")).toHaveCount(filteredCount);
  });

  test("validates API calls contain correct filter parameters", async ({ page }) => {
    await openPrompts(page);

    // Set up network monitoring
    const requests: { url: string; method: string }[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/prompts")) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    const filtersPanel = await openAdvancedFilters(page);

    // Apply multiple filters
    await filtersPanel.getByLabel("urgent").check();
    await filtersPanel.getByLabel("production").check();
    await filtersPanel.getByRole("button", { name: "+ Add Filter" }).click();
    await filtersPanel.locator("input[placeholder='Key']").fill("priority");
    await filtersPanel.locator("input[placeholder='Value']").fill("high");
    await applyFilters(page);

    // Wait for the API call
    await page.waitForTimeout(1000);

    // Verify the API call contains the correct parameters
    const lastRequest = requests[requests.length - 1];
    expect(lastRequest.url).toContain("tags=urgent,production");
    expect(lastRequest.url).toContain("metadataFilters=");
    expect(lastRequest.url).toContain("priority");
    expect(lastRequest.url).toContain("high");
  });
});
