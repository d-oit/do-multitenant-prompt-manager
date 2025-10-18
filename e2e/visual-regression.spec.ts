/**
 * Visual Regression Tests for Mobile-First Design
 * Screenshot comparisons and visual consistency testing across devices
 */

import { test, expect, devices } from "@playwright/test";
import { createTestTenant, createTestPrompt } from "./setup/dbHelpers";

test.describe("Visual Regression Testing", () => {
  let testTenant: any;
  let testPrompts: any[];

  test.beforeAll(async () => {
    testTenant = await createTestTenant("visual-regression-test", "visual-regression-test");
    testPrompts = await Promise.all([
      createTestPrompt(testTenant.id, "Visual Test Prompt 1", "Content for visual testing"),
      createTestPrompt(testTenant.id, "Visual Test Prompt 2", "Second visual test content"),
      createTestPrompt(testTenant.id, "Visual Test Prompt 3", "Third visual test content")
    ]);
  });

  test.describe("Cross-Device Visual Consistency", () => {
    const testDevices = [
      { name: "iPhone SE", device: devices["iPhone SE"] },
      { name: "iPhone 12", device: devices["iPhone 12"] },
      { name: "iPad", device: devices["iPad"] },
      { name: "Desktop", viewport: { width: 1200, height: 800 } }
    ];

    testDevices.forEach(({ name, device, viewport }) => {
      test(`Homepage layout consistency - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device || { viewport });
        const page = await context.newPage();

        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000); // Ensure animations complete

        // Take full page screenshot
        await expect(page).toHaveScreenshot(
          `homepage-${name.toLowerCase().replace(" ", "-")}.png`,
          {
            fullPage: true,
            animations: "disabled"
          }
        );

        await context.close();
      });

      test(`Prompts page layout - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device || { viewport });
        const page = await context.newPage();

        await page.goto("/prompts");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Hide dynamic content (timestamps, etc.)
        await page.addStyleTag({
          content: `
            [data-testid="timestamp"], .timestamp, .last-updated {
              visibility: hidden !important;
            }
          `
        });

        await expect(page).toHaveScreenshot(`prompts-${name.toLowerCase().replace(" ", "-")}.png`, {
          fullPage: true,
          animations: "disabled"
        });

        await context.close();
      });
    });
  });

  test.describe("Component Visual States", () => {
    test("Mobile navigation states", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Closed state
      await expect(page.locator(".mobile-nav")).toHaveScreenshot("mobile-nav-closed.png");

      // Open mobile menu
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      await page.waitForTimeout(500); // Wait for animation

      // Open state
      await expect(page.locator(".mobile-nav__menu")).toHaveScreenshot("mobile-nav-open.png");

      // Hover state simulation
      const firstNavItem = page.locator(".mobile-nav__menu-button").first();
      await firstNavItem.hover();
      await page.waitForTimeout(200);

      await expect(page.locator(".mobile-nav__menu")).toHaveScreenshot("mobile-nav-hover.png");

      await context.close();
    });

    test("Button states across variants", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find different button variants
      const buttons = page.locator("button");
      const buttonCount = Math.min(await buttons.count(), 5);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          // Normal state
          await expect(button).toHaveScreenshot(`button-${i}-normal.png`);

          // Hover state (if supported)
          await button.hover();
          await page.waitForTimeout(100);
          await expect(button).toHaveScreenshot(`button-${i}-hover.png`);

          // Focus state
          await button.focus();
          await page.waitForTimeout(100);
          await expect(button).toHaveScreenshot(`button-${i}-focus.png`);
        }
      }

      await context.close();
    });

    test("Form field states", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find form inputs
      const inputs = page.locator("input, textarea, select");
      const inputCount = Math.min(await inputs.count(), 3);

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          // Empty state
          await expect(input).toHaveScreenshot(`input-${i}-empty.png`);

          // Focused state
          await input.focus();
          await page.waitForTimeout(100);
          await expect(input).toHaveScreenshot(`input-${i}-focused.png`);

          // Filled state
          await input.fill("Test input value");
          await page.waitForTimeout(100);
          await expect(input).toHaveScreenshot(`input-${i}-filled.png`);

          // Error state simulation
          await input.evaluate((el) => el.setAttribute("aria-invalid", "true"));
          await page.addStyleTag({
            content: `
              [aria-invalid="true"] {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 1px #ef4444 !important;
              }
            `
          });
          await page.waitForTimeout(100);
          await expect(input).toHaveScreenshot(`input-${i}-error.png`);
        }
      }

      await context.close();
    });

    test("Data table responsive states", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // Mobile card layout
      const mobileCards = page.locator(".data-table__mobile-card");
      if (await mobileCards.first().isVisible()) {
        await expect(mobileCards.first()).toHaveScreenshot("data-table-mobile-card.png");

        // Selected state
        const checkbox = mobileCards.first().locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await page.waitForTimeout(200);
          await expect(mobileCards.first()).toHaveScreenshot("data-table-mobile-card-selected.png");
        }
      }

      // Switch to desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);

      const desktopTable = page.locator(".data-table__table");
      if (await desktopTable.isVisible()) {
        await expect(desktopTable).toHaveScreenshot("data-table-desktop.png");
      }

      await context.close();
    });
  });

  test.describe("Theme Visual Consistency", () => {
    test("Light theme components", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Ensure light theme
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "light");
      });
      await page.waitForTimeout(300);

      // Component screenshots in light theme
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await expect(hamburger).toHaveScreenshot("hamburger-light-theme.png");

      await hamburger.click();
      await page.waitForTimeout(500);

      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toHaveScreenshot("mobile-menu-light-theme.png");

      await context.close();
    });

    test("Dark theme components", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await page.waitForTimeout(300);

      // Component screenshots in dark theme
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await expect(hamburger).toHaveScreenshot("hamburger-dark-theme.png");

      await hamburger.click();
      await page.waitForTimeout(500);

      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toHaveScreenshot("mobile-menu-dark-theme.png");

      await context.close();
    });

    test("High contrast mode", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Enable high contrast mode
      await page.emulateMedia({ forcedColors: "active" });
      await page.waitForTimeout(300);

      // Take screenshots in high contrast mode
      const mainContent = page.locator("main, .app-shell");
      await expect(mainContent).toHaveScreenshot("high-contrast-main.png");

      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await expect(hamburger).toHaveScreenshot("hamburger-high-contrast.png");

      await context.close();
    });
  });

  test.describe("Animation and Transition States", () => {
    test("Loading states visual verification", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // Intercept API to simulate loading
      await page.route("**/api/prompts**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto("/prompts");

      // Capture loading state
      const loadingContainer = page.locator(".data-table__loading, .skeleton-loader");
      if (await loadingContainer.first().isVisible()) {
        await expect(loadingContainer.first()).toHaveScreenshot("loading-state.png");
      }

      // Wait for content to load
      await page.waitForLoadState("networkidle");

      // Capture loaded state
      const loadedContent = page.locator(".data-table__mobile-card, .data-table__table");
      if (await loadedContent.first().isVisible()) {
        await expect(loadedContent.first()).toHaveScreenshot("loaded-state.png");
      }

      await context.close();
    });

    test("Skeleton loader variations", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Inject skeleton loaders for testing
      await page.addStyleTag({
        content: `
          .visual-test-skeleton-text {
            height: 16px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: 4px;
            margin: 4px 0;
          }
          .visual-test-skeleton-circular {
            width: 40px;
            height: 40px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: 50%;
          }
          .visual-test-skeleton-rectangular {
            height: 120px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: 8px;
          }
          @keyframes skeleton-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `
      });

      await page.evaluate(() => {
        const container = document.createElement("div");
        container.innerHTML = `
          <div style="padding: 20px;">
            <div class="visual-test-skeleton-text" style="width: 60%;"></div>
            <div class="visual-test-skeleton-text" style="width: 80%;"></div>
            <div class="visual-test-skeleton-text" style="width: 40%;"></div>
            <div style="margin: 20px 0;">
              <div class="visual-test-skeleton-circular"></div>
            </div>
            <div class="visual-test-skeleton-rectangular"></div>
          </div>
        `;
        document.body.appendChild(container);
      });

      await page.waitForTimeout(500);

      const skeletonContainer = page.locator("div").last();
      await expect(skeletonContainer).toHaveScreenshot("skeleton-variations.png");

      await context.close();
    });

    test("Error states visual verification", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // Mock API errors
      await page.route("**/api/**", async (route) => {
        await route.abort("failed");
      });

      await page.goto("/prompts");
      await page.waitForTimeout(2000);

      // Capture error state
      const errorContainer = page.locator('.error, [role="alert"], :has-text("error")');
      if (await errorContainer.first().isVisible()) {
        await expect(errorContainer.first()).toHaveScreenshot("error-state.png");
      }

      await context.close();
    });
  });

  test.describe("Responsive Breakpoint Transitions", () => {
    test("Layout transitions at breakpoints", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("layout-desktop-1200.png");

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("layout-tablet-768.png");

      // Large mobile
      await page.setViewportSize({ width: 414, height: 896 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("layout-mobile-414.png");

      // Small mobile
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("layout-mobile-320.png");
    });

    test("Data table breakpoint transitions", async ({ page }) => {
      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // Desktop table
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(300);
      const desktopTable = page.locator(".data-table");
      await expect(desktopTable).toHaveScreenshot("table-desktop-1200.png");

      // Tablet table
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(300);
      await expect(desktopTable).toHaveScreenshot("table-tablet-800.png");

      // Mobile cards
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      const mobileCards = page.locator(".data-table");
      await expect(mobileCards).toHaveScreenshot("table-mobile-375.png");
    });
  });

  test.describe("Accessibility Visual States", () => {
    test("Focus indicators visibility", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Tab through elements and capture focus states
      const focusableElements = page.locator("button, [href], input, select, textarea");
      const elementCount = Math.min(await focusableElements.count(), 5);

      for (let i = 0; i < elementCount; i++) {
        const element = focusableElements.nth(i);
        if (await element.isVisible()) {
          await element.focus();
          await page.waitForTimeout(100);
          await expect(element).toHaveScreenshot(`focus-indicator-${i}.png`);
        }
      }

      await context.close();
    });

    test("Reduced motion preferences", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open mobile menu with reduced motion
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      await page.waitForTimeout(100); // Shorter wait since animations are reduced

      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toHaveScreenshot("reduced-motion-menu.png");

      await context.close();
    });
  });
});
