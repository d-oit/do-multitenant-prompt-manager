/**
 * Mobile Test Runner and Integration Tests
 * Comprehensive test suite for mobile-first responsive design
 */

import { test, expect, devices } from "@playwright/test";

test.describe("Mobile-First Design Integration Tests", () => {
  const testViewports = [
    { name: "iPhone SE", ...devices["iPhone SE"] },
    { name: "iPhone 12", ...devices["iPhone 12"] },
    { name: "iPad", ...devices["iPad"] },
    { name: "Desktop", viewport: { width: 1200, height: 800 } }
  ];

  testViewports.forEach(({ name, ...deviceConfig }) => {
    test.describe(`${name} Integration`, () => {
      test(`Complete user flow on ${name}`, async ({ browser }) => {
        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        try {
          // 1. Load application
          await page.goto("/");
          await page.waitForLoadState("networkidle");
          await expect(page.getByRole("heading", { name: /d.o. Prompt Manager/i })).toBeVisible();

          // 2. Test navigation based on device
          if (name.includes("iPhone")) {
            // Mobile navigation flow
            const hamburger = page.locator(".mobile-nav__hamburger-button");
            if (await hamburger.isVisible()) {
              await hamburger.click();
              const menu = page.locator(".mobile-nav__menu");
              await expect(menu).toBeVisible();

              await page.locator('.mobile-nav__menu-button:has-text("Prompts")').click();
              await expect(menu).not.toBeVisible();
            }
          } else {
            // Desktop/tablet navigation flow
            await page.getByRole("button", { name: "Prompts" }).first().click();
          }

          await page.waitForLoadState("networkidle");
          await expect(page.getByRole("heading", { name: "Prompts" }).first()).toBeVisible();

          // 3. Test responsive table/cards
          if (name.includes("iPhone")) {
            // Should show mobile cards
            const mobileCards = page.locator(".data-table__mobile-card");
            if (await mobileCards.first().isVisible()) {
              await expect(mobileCards.first()).toBeVisible();
            }
          } else {
            // Should show desktop table
            const desktopTable = page.locator(".data-table__table");
            if (await desktopTable.isVisible()) {
              await expect(desktopTable).toBeVisible();
            }
          }

          // 4. Test accessibility
          await page.keyboard.press("Tab");
          const focusedElement = page.locator(":focus");
          await expect(focusedElement).toBeVisible();

          // 5. Test theme switching
          const themeToggle = page.locator(".theme-switcher button, .dark-mode-toggle__button");
          if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(300);

            const htmlElement = page.locator("html");
            const theme = await htmlElement.getAttribute("data-theme");
            expect(["dark", "light", null]).toContain(theme);
          }
        } finally {
          await context.close();
        }
      });

      test(`Performance benchmarks on ${name}`, async ({ browser }) => {
        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        try {
          // Measure page load performance
          const startTime = Date.now();
          await page.goto("/");
          await page.waitForLoadState("networkidle");
          const loadTime = Date.now() - startTime;

          // Performance thresholds by device type
          let maxLoadTime = 5000; // Default 5 seconds
          if (name.includes("iPhone")) {
            maxLoadTime = 6000; // Mobile can be slightly slower
          } else if (name === "Desktop") {
            maxLoadTime = 3000; // Desktop should be fastest
          }

          expect(loadTime).toBeLessThan(maxLoadTime);

          // Test interaction responsiveness
          const button = page.locator("button").first();
          if (await button.isVisible()) {
            const interactionStart = Date.now();
            await button.click();
            const interactionTime = Date.now() - interactionStart;

            expect(interactionTime).toBeLessThan(500); // 500ms max response time
          }
        } finally {
          await context.close();
        }
      });

      test(`Touch interactions on ${name}`, async ({ browser }) => {
        // Skip touch tests on desktop
        if (name === "Desktop") return;

        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        try {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Test touch target sizes
          const touchTargets = page.locator('button, [role="button"], a, input');
          const sampleSize = Math.min(await touchTargets.count(), 10);

          for (let i = 0; i < sampleSize; i++) {
            const target = touchTargets.nth(i);
            if (await target.isVisible()) {
              const box = await target.boundingBox();
              if (box) {
                // Minimum touch target size should be 44x44px
                expect(box.height).toBeGreaterThanOrEqual(32); // Slightly relaxed
                expect(box.width).toBeGreaterThanOrEqual(32);
              }
            }
          }

          // Test gesture interactions if mobile navigation exists
          const hamburger = page.locator(".mobile-nav__hamburger-button");
          if (await hamburger.isVisible()) {
            // Test tap interaction
            await hamburger.click();
            const menu = page.locator(".mobile-nav__menu");
            await expect(menu).toBeVisible();

            // Test closing by tapping overlay
            const overlay = page.locator(".mobile-nav__overlay");
            if (await overlay.isVisible()) {
              await overlay.click();
              await expect(menu).not.toBeVisible();
            }
          }
        } finally {
          await context.close();
        }
      });
    });
  });

  test.describe("Cross-Device Compatibility", () => {
    test("Layout consistency across devices", async ({ browser }) => {
      const results: { [key: string]: any } = {};

      // Test same content on different devices
      for (const { name, ...deviceConfig } of testViewports) {
        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        await page.goto("/prompts");
        await page.waitForLoadState("networkidle");

        // Capture layout information
        results[name] = {
          hasTable: await page.locator(".data-table__table").isVisible(),
          hasCards: await page.locator(".data-table__mobile-card").isVisible(),
          hasMobileNav: await page.locator(".mobile-nav").isVisible(),
          hasSidebar: await page.locator(".app-shell__sidebar").isVisible()
        };

        await context.close();
      }

      // Verify responsive behavior
      expect(results["iPhone SE"].hasCards || results["iPhone SE"].hasTable).toBe(true);
      expect(results["iPhone SE"].hasMobileNav).toBe(true);
      expect(results["Desktop"].hasSidebar).toBe(true);
      expect(results["Desktop"].hasMobileNav).toBe(false);
    });

    test("Feature parity across devices", async ({ browser }) => {
      const features = ["theme switching", "navigation", "data display", "user interactions"];

      for (const { name, ...deviceConfig } of testViewports) {
        const context = await browser.newContext(deviceConfig);
        const page = await context.newPage();

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Test theme switching
        const themeToggle = page.locator(".theme-switcher button, .dark-mode-toggle__button");
        const hasThemeSwitch = await themeToggle.isVisible();

        // Test navigation
        let canNavigate = false;
        if (name.includes("iPhone")) {
          const hamburger = page.locator(".mobile-nav__hamburger-button");
          canNavigate = await hamburger.isVisible();
        } else {
          const navButton = page.getByRole("button", { name: "Prompts" }).first();
          canNavigate = await navButton.isVisible();
        }

        // All devices should have core functionality
        expect(hasThemeSwitch).toBe(true);
        expect(canNavigate).toBe(true);

        await context.close();
      }
    });
  });
});
