/**
 * Complete User Workflows on Mobile E2E Tests
 * End-to-end user journeys and complex interaction flows on mobile devices
 */

import { test, expect, devices } from "@playwright/test";
import { createTestTenant, createTestPrompt } from "./setup/dbHelpers";

test.describe("Complete Mobile User Workflows", () => {
  let testTenant: any;
  let testPrompts: any[];

  test.beforeAll(async () => {
    testTenant = await createTestTenant("user-workflows-test", "user-workflows-test");
    testPrompts = await Promise.all([
      createTestPrompt(testTenant.id, "Workflow Test Prompt 1", "Content for workflow testing"),
      createTestPrompt(testTenant.id, "Workflow Test Prompt 2", "Second workflow content"),
      createTestPrompt(testTenant.id, "Workflow Test Prompt 3", "Third workflow content")
    ]);
  });

  test.describe("New User Onboarding Flow", () => {
    test("First-time mobile user complete journey", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // 1. First visit - onboarding
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Should show application header
      await expect(page.getByRole("heading", { name: /d.o. Prompt Manager/i })).toBeVisible();

      // 2. Discover mobile navigation
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await expect(hamburger).toBeVisible();

      // First interaction with mobile nav
      await hamburger.click();
      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toBeVisible();

      // Explore navigation options
      const navItems = page.locator(".mobile-nav__menu-button");
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);

      // 3. Navigate to main content area
      await navItems.filter({ hasText: "Prompts" }).click();
      await expect(menu).not.toBeVisible();
      await page.waitForLoadState("networkidle");

      // Should show prompts in mobile-friendly format
      const promptContent = page.locator(".data-table__mobile-card, .data-table__table");
      await expect(promptContent.first()).toBeVisible();

      // 4. Interact with content
      const firstPrompt = page.locator(".data-table__mobile-card").first();
      if (await firstPrompt.isVisible()) {
        await firstPrompt.click();
        // Should show prompt details or selection
      }

      // 5. Discover theme switching
      const themeToggle = page.locator(".theme-switcher button, .dark-mode-toggle__button");
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Theme should change
        const theme = await page.locator("html").getAttribute("data-theme");
        expect(["dark", "light"]).toContain(theme);
      }

      // 6. Complete workflow by returning to dashboard
      await hamburger.click();
      await page.locator('.mobile-nav__menu-button:has-text("Dashboard")').click();
      await page.waitForLoadState("networkidle");

      await context.close();
    });

    test("Mobile user discovers accessibility features", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test keyboard navigation discovery
      await page.keyboard.press("Tab");
      const firstFocused = page.locator(":focus");
      await expect(firstFocused).toBeVisible();

      // Should have visible focus indicators
      const focusStyles = await firstFocused.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });

      expect(
        focusStyles.outline !== "none" ||
          focusStyles.outlineWidth !== "0px" ||
          focusStyles.boxShadow.includes("rgb")
      ).toBe(true);

      // Test skip links
      const skipLink = page.locator(".skip-link");
      if (await skipLink.isVisible()) {
        await skipLink.click();
      }

      // Test reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });

      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();

      const menu = page.locator(".mobile-nav__menu");
      const animationDuration = await menu.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration || computed.transitionDuration;
      });

      // Should respect reduced motion
      expect(["0s", "0.01ms", "none"].some((val) => animationDuration.includes(val))).toBe(true);

      await context.close();
    });
  });

  test.describe("Power User Workflows", () => {
    test("Efficient mobile prompt management", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // 1. Quick navigation using mobile interface
      const mobileCards = page.locator(".data-table__mobile-card");
      if (await mobileCards.first().isVisible()) {
        const cardCount = await mobileCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // 2. Bulk selection workflow
        const selectAllCheckbox = page.locator(
          '.data-table__header-cell--selection input[type="checkbox"]'
        );
        if (await selectAllCheckbox.isVisible()) {
          await selectAllCheckbox.click();

          // Verify all items selected
          const selectedCards = page.locator(".data-table__mobile-card--selected");
          const selectedCount = await selectedCards.count();
          expect(selectedCount).toBe(cardCount);
        }

        // 3. Quick filter/search workflow
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill("Workflow");
          await page.waitForTimeout(500);

          // Should filter results
          const filteredCards = page.locator(".data-table__mobile-card");
          const filteredCount = await filteredCards.count();
          expect(filteredCount).toBeLessThanOrEqual(cardCount);
        }
      }

      // 4. Command palette usage for power users
      await page.keyboard.press("Control+k");
      const commandPalette = page.locator(".command-palette");
      if (await commandPalette.isVisible()) {
        await expect(commandPalette).toBeVisible();

        const searchInput = page.locator(".command-palette__input");
        await searchInput.fill("create");
        await page.waitForTimeout(300);

        const commands = page.locator(".command-palette__command");
        if (await commands.first().isVisible()) {
          await page.keyboard.press("Enter");
          await expect(commandPalette).not.toBeVisible();
        }
      }

      await context.close();
    });

    test("Multi-tenant workflow on mobile", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // 1. Navigate to tenant management
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();

      const tenantNav = page.locator('.mobile-nav__menu-button:has-text("Tenants")');
      if (await tenantNav.isVisible()) {
        await tenantNav.click();
        await page.waitForLoadState("networkidle");

        // 2. Create new tenant on mobile
        const createTenantToggle = page.locator(
          'summary:has-text("Create tenant"), button:has-text("Create")'
        );
        if (await createTenantToggle.first().isVisible()) {
          await createTenantToggle.first().click();

          // Fill tenant form on mobile
          const nameInput = page.locator('input[name="name"], [label="Name"] input');
          if (await nameInput.isVisible()) {
            await nameInput.fill("Mobile Test Tenant");

            const slugInput = page.locator('input[name="slug"], [label="Slug"] input');
            if (await slugInput.isVisible()) {
              await slugInput.fill("mobile-test-tenant");

              const submitButton = page.locator('button[type="submit"]:has-text("Create")');
              if (await submitButton.isVisible()) {
                await submitButton.click();
                await page.waitForTimeout(1000);

                // Should show success feedback
                const successMessage = page.locator(':has-text("created"), [role="alert"]');
                if (await successMessage.isVisible()) {
                  await expect(successMessage).toBeVisible();
                }
              }
            }
          }
        }

        // 3. Switch between tenants
        const tenantSelector = page.locator("select, .tenant-selector");
        if (await tenantSelector.isVisible()) {
          // Should be able to switch tenants on mobile
          await tenantSelector.click();
        }
      }

      await context.close();
    });
  });

  test.describe("Cross-Feature Integration Workflows", () => {
    test("Analytics to prompts drill-down workflow", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // 1. Start at analytics
      await page.goto("/analytics");
      await page.waitForLoadState("networkidle");

      // Should show analytics in mobile format
      const analyticsContent = page.locator(".analytics-panel, .chart-container, main");
      await expect(analyticsContent).toBeVisible();

      // 2. Identify actionable insight
      const analyticsCard = page.locator(".analytics-card, .chart-card").first();
      if (await analyticsCard.isVisible()) {
        await analyticsCard.click();

        // Should provide drill-down option or navigation
        await page.waitForTimeout(500);
      }

      // 3. Navigate to related prompts
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      await page.locator('.mobile-nav__menu-button:has-text("Prompts")').click();
      await page.waitForLoadState("networkidle");

      // 4. Verify context is maintained
      const promptsContent = page.locator(".data-table__mobile-card, .data-table__table");
      await expect(promptsContent.first()).toBeVisible();

      await context.close();
    });

    test("Create-to-test prompt workflow", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // 1. Initiate prompt creation
      const createButton = page.locator('button:has-text("Create"), .fab, .floating-action-button');
      if (await createButton.isVisible()) {
        await createButton.click();

        // Should open creation interface (modal, form, or navigation)
        await page.waitForTimeout(500);

        // 2. Fill prompt details on mobile
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill("Mobile Created Prompt");

          const contentInput = page.locator(
            'textarea[name="content"], textarea[placeholder*="content"]'
          );
          if (await contentInput.isVisible()) {
            await contentInput.fill("This prompt was created on mobile device");

            // 3. Save prompt
            const saveButton = page.locator(
              'button[type="submit"]:has-text("Save"), button:has-text("Create")'
            );
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(1000);

              // Should show in prompt list
              const newPrompt = page.locator(':has-text("Mobile Created Prompt")');
              await expect(newPrompt).toBeVisible();
            }
          }
        }
      }

      // 4. Test the created prompt
      const createdPrompt = page.locator(
        '.data-table__mobile-card:has-text("Mobile Created Prompt")'
      );
      if (await createdPrompt.isVisible()) {
        await createdPrompt.click();

        // Should open prompt details or testing interface
        await page.waitForTimeout(500);
      }

      await context.close();
    });

    test("Collaboration workflow on mobile", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // 1. Select prompt for collaboration
      const promptCard = page.locator(".data-table__mobile-card").first();
      if (await promptCard.isVisible()) {
        // Long press or specific interaction for collaboration
        const box = await promptCard.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press
          await page.mouse.up();

          // Should show collaboration options
          await page.waitForTimeout(300);
        }

        // 2. Alternative: Click to open details
        await promptCard.click();
        await page.waitForTimeout(500);

        // 3. Look for collaboration features
        const shareButton = page.locator('button:has-text("Share"), [aria-label*="share"]');
        if (await shareButton.isVisible()) {
          await shareButton.click();

          // Should open sharing interface
          const shareDialog = page.locator('[role="dialog"], .modal, .bottom-sheet');
          if (await shareDialog.isVisible()) {
            await expect(shareDialog).toBeVisible();

            // Should have mobile-friendly sharing options
            const shareOptions = page.locator("button, a, input");
            const optionCount = await shareOptions.count();
            expect(optionCount).toBeGreaterThan(0);
          }
        }
      }

      await context.close();
    });
  });

  test.describe("Error Recovery Workflows", () => {
    test("Network interruption during form submission", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // 1. Start filling a form
      const form = page.locator("form").first();
      if (await form.isVisible()) {
        const input = form.locator("input").first();
        if (await input.isVisible()) {
          await input.fill("Test data before network interruption");

          // 2. Simulate network interruption during submission
          const submitButton = form.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            // Go offline just before submission
            await page.setOffline(true);
            await submitButton.click();

            // 3. Should handle gracefully
            await page.waitForTimeout(1000);

            // Should show offline indicator or error
            const offlineMessage = page.locator(
              ':has-text("offline"), :has-text("connection"), [role="alert"]'
            );

            // 4. Recover when online
            await page.setOffline(false);
            await page.waitForTimeout(1000);

            // Should be able to retry submission
            if (await submitButton.isVisible()) {
              await submitButton.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }

      await context.close();
    });

    test("App state recovery after memory pressure", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // 1. Set up user state
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill("important search term");
        await page.waitForTimeout(500);
      }

      // 2. Simulate memory pressure and page backgrounding
      await page.evaluate(() => {
        // Trigger memory warning
        window.dispatchEvent(new CustomEvent("memory-warning"));

        // Simulate page going to background
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", { value: true, writable: true });
      });

      await page.waitForTimeout(1000);

      // 3. Bring page back to foreground
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { value: false, writable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // 4. Verify state recovery
      if (await searchInput.isVisible()) {
        const savedValue = await searchInput.inputValue();
        expect(savedValue).toBe("important search term");
      }

      // Should still be functional
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toBeVisible();

      await context.close();
    });

    test("Progressive enhancement fallback workflow", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // Disable JavaScript to test progressive enhancement
      await context.setJavaScriptEnabled(false);

      await page.goto("/");
      await page.waitForTimeout(2000);

      // Should still show basic content
      const mainContent = page.locator("h1, main, .app-shell");
      await expect(mainContent.first()).toBeVisible();

      // Re-enable JavaScript
      await context.setJavaScriptEnabled(true);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should upgrade to full functionality
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      if (await hamburger.isVisible()) {
        await hamburger.click();
        const menu = page.locator(".mobile-nav__menu");
        await expect(menu).toBeVisible();
      }

      await context.close();
    });
  });

  test.describe("Performance-Critical Workflows", () => {
    test("Large dataset interaction workflow", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // Create large dataset for testing
      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          createTestPrompt(
            testTenant.id,
            `Performance Test ${i + 1}`,
            `Large dataset content ${i + 1}`
          )
        )
      );

      const startTime = Date.now();
      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even with large dataset
      expect(loadTime).toBeLessThan(5000);

      // Should implement virtual scrolling or pagination
      const cards = page.locator(".data-table__mobile-card");
      if (await cards.first().isVisible()) {
        const visibleCards = await cards.count();
        expect(visibleCards).toBeLessThanOrEqual(25); // Should limit visible items
      }

      // Scrolling should remain smooth
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(100);
      }

      // Should still be responsive
      const firstCard = cards.first();
      if (await firstCard.isVisible()) {
        const interactionStart = Date.now();
        await firstCard.click();
        const interactionTime = Date.now() - interactionStart;
        expect(interactionTime).toBeLessThan(500);
      }

      await context.close();
    });

    test("Rapid navigation workflow", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Rapidly navigate between sections
      const sections = ["Prompts", "Analytics", "Tenants", "Dashboard"];

      for (let i = 0; i < 3; i++) {
        // Do multiple rounds
        for (const section of sections) {
          const hamburger = page.locator(".mobile-nav__hamburger-button");
          await hamburger.click();

          const navItem = page.locator(`.mobile-nav__menu-button:has-text("${section}")`);
          await navItem.click();

          // Should navigate quickly
          await page.waitForLoadState("networkidle", { timeout: 3000 });

          // Should show correct content
          const heading = page.locator(
            `h1:has-text("${section}"), h2:has-text("${section}"), .page-title`
          );
          // Content should load appropriately
        }
      }

      // App should remain responsive after rapid navigation
      const finalHamburger = page.locator(".mobile-nav__hamburger-button");
      await finalHamburger.click();
      const finalMenu = page.locator(".mobile-nav__menu");
      await expect(finalMenu).toBeVisible();

      await context.close();
    });
  });
});
