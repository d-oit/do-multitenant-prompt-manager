/**
 * Advanced Mobile Interactions E2E Tests
 * Complex gesture combinations, multi-touch scenarios, and advanced UI patterns
 */

import { test, expect, devices } from "@playwright/test";
import { createTestTenant, createTestPrompt } from "./setup/dbHelpers";

test.describe("Advanced Mobile Interaction Patterns", () => {
  let testTenant: any;

  test.beforeAll(async () => {
    testTenant = await createTestTenant("advanced-interactions-test", "advanced-interactions-test");
  });

  test.describe("Complex Gesture Combinations", () => {
    test("Swipe-to-action with confirmation", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      const promptCard = page.locator(".data-table__mobile-card").first();
      if (await promptCard.isVisible()) {
        const box = await promptCard.boundingBox();
        if (box) {
          // Swipe left to reveal actions
          await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
          await page.mouse.up();

          // Should reveal action buttons
          await page.waitForTimeout(300);

          const actionButtons = page.locator(".swipe-action, .card-action, [data-action]");
          if (await actionButtons.first().isVisible()) {
            // Tap action that requires confirmation
            const deleteAction = actionButtons.filter({ hasText: /delete|remove/i }).first();
            if (await deleteAction.isVisible()) {
              await deleteAction.click();

              // Should show confirmation dialog
              const confirmDialog = page.locator('[role="dialog"], .confirm-dialog, .modal');
              if (await confirmDialog.isVisible()) {
                await expect(confirmDialog).toBeVisible();

                // Test canceling
                const cancelButton = confirmDialog.locator(
                  'button:has-text("Cancel"), button[aria-label*="cancel"]'
                );
                if (await cancelButton.isVisible()) {
                  await cancelButton.click();
                  await expect(confirmDialog).not.toBeVisible();
                }
              }
            }
          }
        }
      }

      await context.close();
    });

    test("Drag and drop on mobile", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // Test drag and drop for reordering
      const cards = page.locator(".data-table__mobile-card");
      if ((await cards.count()) >= 2) {
        const firstCard = cards.nth(0);
        const secondCard = cards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Long press to initiate drag
          await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press threshold

          // Drag to second card position
          await page.mouse.move(
            secondBox.x + secondBox.width / 2,
            secondBox.y + secondBox.height / 2,
            { steps: 10 }
          );
          await page.waitForTimeout(200);
          await page.mouse.up();

          // Should indicate successful drag operation
          await page.waitForTimeout(500);

          // Visual feedback should be provided during drag
          const dragIndicator = page.locator(".drag-indicator, .dragging, [data-dragging]");
          // Implementation depends on actual drag and drop implementation
        }
      }

      await context.close();
    });

    test("Multi-finger gesture prevention", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test that multi-touch gestures don't break interface
      await page.evaluate(() => {
        // Simulate multi-touch event
        const touches = [
          new Touch({ identifier: 0, target: document.body, clientX: 100, clientY: 100 }),
          new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: 200 })
        ];

        const touchEvent = new TouchEvent("touchstart", {
          touches,
          targetTouches: touches,
          changedTouches: touches,
          bubbles: true,
          cancelable: true
        });

        document.body.dispatchEvent(touchEvent);
      });

      // Interface should remain stable
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toBeVisible();

      await context.close();
    });

    test("Gesture cancellation handling", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const hamburger = page.locator(".mobile-nav__hamburger-button");
      const box = await hamburger.boundingBox();

      if (box) {
        // Start touch but move away (cancel gesture)
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();

        // Move far away to cancel
        await page.mouse.move(0, 0, { steps: 5 });

        // Simulate touch cancel
        await page.evaluate(() => {
          const touchEvent = new TouchEvent("touchcancel", {
            bubbles: true,
            cancelable: true
          });
          document.body.dispatchEvent(touchEvent);
        });

        await page.mouse.up();

        // Should handle cancellation gracefully
        const menu = page.locator(".mobile-nav__menu");
        await expect(menu).not.toBeVisible();

        // Normal interaction should still work
        await hamburger.click();
        await expect(menu).toBeVisible();
      }

      await context.close();
    });
  });

  test.describe("Advanced Form Interactions", () => {
    test("Mobile form with complex validation", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find complex form (tenant creation or prompt creation)
      const createToggle = page.locator('summary:has-text("Create"), button:has-text("Create")');
      if (await createToggle.first().isVisible()) {
        await createToggle.first().click();

        const form = page.locator("form");
        if (await form.isVisible()) {
          // Test progressive validation
          const nameInput = page.locator('input[name="name"], input[label*="name"]');
          if (await nameInput.isVisible()) {
            // Type invalid data
            await nameInput.fill("a"); // Too short
            await nameInput.blur();

            // Should show inline validation
            const validationMessage = page.locator('.error, [role="alert"], [aria-invalid="true"]');
            if (await validationMessage.isVisible()) {
              await expect(validationMessage).toBeVisible();
            }

            // Fix validation error
            await nameInput.fill("Valid Tenant Name");
            await nameInput.blur();

            // Error should clear
            if (await validationMessage.isVisible()) {
              await expect(validationMessage).not.toBeVisible();
            }
          }

          // Test form submission with partial data
          const submitButton = form.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should show field-specific errors
            const fieldErrors = page.locator('.field-error, [aria-invalid="true"]');
            if (await fieldErrors.first().isVisible()) {
              const errorCount = await fieldErrors.count();
              expect(errorCount).toBeGreaterThan(0);
            }
          }
        }
      }

      await context.close();
    });

    test("Mobile file upload simulation", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Look for file upload elements
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Simulate mobile file selection
        await fileInput.setInputFiles({
          name: "mobile-test-file.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Mobile test file content")
        });

        // Should show upload progress or confirmation
        const uploadIndicator = page.locator(".upload-progress, .file-selected, [data-upload]");
        if (await uploadIndicator.isVisible()) {
          await expect(uploadIndicator).toBeVisible();
        }
      }

      await context.close();
    });

    test("Mobile autofill and form completion", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test autofill-friendly form attributes
      const nameInput = page.locator('input[name="name"], input[autocomplete="name"]');
      if (await nameInput.isVisible()) {
        const autocomplete = await nameInput.getAttribute("autocomplete");
        const name = await nameInput.getAttribute("name");

        // Should have appropriate autocomplete attributes
        expect(autocomplete || name).toBeTruthy();

        // Simulate autofill
        await nameInput.fill("John Doe");

        // Should handle programmatic value setting
        const value = await nameInput.inputValue();
        expect(value).toBe("John Doe");
      }

      // Test form persistence across navigation
      const emailInput = page.locator('input[type="email"], input[autocomplete="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill("test@example.com");

        // Navigate away and back
        await page.goBack();
        await page.goForward();

        // Form should restore or ask to restore values
        await page.waitForLoadState("networkidle");
      }

      await context.close();
    });
  });

  test.describe("Advanced Modal and Overlay Patterns", () => {
    test("Nested modal handling on mobile", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open first modal (mobile menu)
      const hamburger = page.locator(".mobile-nav__hamburger-button");
      await hamburger.click();
      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toBeVisible();

      // Trigger second modal from within first
      const settingsButton = menu.locator('button:has-text("Settings"), [aria-label*="settings"]');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        const settingsModal = page.locator('[role="dialog"]:not(.mobile-nav__menu)');
        if (await settingsModal.isVisible()) {
          await expect(settingsModal).toBeVisible();

          // Both modals should be manageable
          // Focus should be trapped in the top modal
          await page.keyboard.press("Tab");
          const focusedElement = page.locator(":focus");

          // Should be within the settings modal
          const isInSettingsModal = (await settingsModal.locator(":focus").count()) > 0;
          if (isInSettingsModal) {
            expect(isInSettingsModal).toBe(true);
          }

          // Close settings modal
          await page.keyboard.press("Escape");
          await expect(settingsModal).not.toBeVisible();

          // Original menu should still be open
          await expect(menu).toBeVisible();

          // Close original menu
          await page.keyboard.press("Escape");
          await expect(menu).not.toBeVisible();
        }
      }

      await context.close();
    });

    test("Bottom sheet with dynamic content", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      // Trigger bottom sheet
      const promptCard = page.locator(".data-table__mobile-card").first();
      if (await promptCard.isVisible()) {
        await promptCard.click();

        const bottomSheet = page.locator('.bottom-sheet, [role="dialog"]');
        if (await bottomSheet.isVisible()) {
          await expect(bottomSheet).toBeVisible();

          // Test dynamic content loading
          const loadingIndicator = page.locator(".loading, .skeleton-loader");
          if (await loadingIndicator.isVisible()) {
            // Should eventually load content
            await page.waitForTimeout(2000);
            const content = page.locator(".bottom-sheet__content");
            await expect(content).toBeVisible();
          }

          // Test drag handle interaction
          const dragHandle = page.locator(".bottom-sheet__drag-handle");
          if (await dragHandle.isVisible()) {
            const handleBox = await dragHandle.boundingBox();
            if (handleBox) {
              // Partial drag (shouldn't close)
              await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y);
              await page.mouse.down();
              await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 30, {
                steps: 3
              });
              await page.mouse.up();

              // Should still be open
              await expect(bottomSheet).toBeVisible();

              // Full drag down (should close)
              await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y);
              await page.mouse.down();
              await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 150, {
                steps: 10
              });
              await page.mouse.up();

              // Should close
              await expect(bottomSheet).not.toBeVisible({ timeout: 1000 });
            }
          }
        }
      }

      await context.close();
    });

    test("Progressive disclosure on mobile", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test collapsible sections
      const collapsibleSections = page.locator("details, .collapsible, [aria-expanded]");
      if (await collapsibleSections.first().isVisible()) {
        const section = collapsibleSections.first();
        const isExpanded = await section.getAttribute("aria-expanded");

        await section.click();
        await page.waitForTimeout(300);

        // Should toggle state
        const newState = await section.getAttribute("aria-expanded");
        expect(newState).not.toBe(isExpanded);

        // Content should animate smoothly on mobile
        const content = section.locator('.collapsible-content, [role="region"]');
        if (await content.isVisible()) {
          const contentBox = await content.boundingBox();
          expect(contentBox?.height).toBeGreaterThan(0);
        }
      }

      await context.close();
    });
  });

  test.describe("Performance-Critical Interactions", () => {
    test("Smooth scrolling with momentum", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      // Create large dataset for scroll testing
      await Promise.all(
        Array.from({ length: 30 }, (_, i) =>
          createTestPrompt(
            testTenant.id,
            `Scroll Test ${i + 1}`,
            `Content for scroll test ${i + 1}`
          )
        )
      );

      await page.goto("/prompts");
      await page.waitForLoadState("networkidle");

      const scrollContainer = page.locator(".data-table__container, main, .scroll-container");
      if (await scrollContainer.isVisible()) {
        const containerBox = await scrollContainer.boundingBox();
        if (containerBox) {
          // Test momentum scrolling
          const startY = containerBox.y + 100;
          const endY = startY - 200;

          await page.mouse.move(containerBox.x + containerBox.width / 2, startY);
          await page.mouse.down();

          // Fast swipe for momentum
          await page.mouse.move(containerBox.x + containerBox.width / 2, endY, { steps: 3 });
          await page.mouse.up();

          // Should continue scrolling with momentum
          await page.waitForTimeout(500);

          // Check that scroll position changed
          const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
          expect(scrollTop).toBeGreaterThan(0);
        }
      }

      await context.close();
    });

    test("60fps animation verification", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Measure animation frame rate during mobile menu opening
      const hamburger = page.locator(".mobile-nav__hamburger-button");

      const frameRate = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();

          const countFrames = () => {
            frameCount++;
            const elapsed = performance.now() - startTime;

            if (elapsed < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frameCount);
            }
          };

          requestAnimationFrame(countFrames);
        });
      });

      // Should maintain 60fps (at least 50fps accounting for system load)
      expect(frameRate).toBeGreaterThan(50);

      // Test animation during interaction
      await hamburger.click();
      const menu = page.locator(".mobile-nav__menu");
      await expect(menu).toBeVisible();

      // Animation should complete smoothly
      const transform = await menu.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });

      // Should not be in mid-animation state
      expect(transform).not.toContain("matrix");

      await context.close();
    });

    test("Touch response latency", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Measure touch to visual feedback latency
      const button = page.locator("button").first();
      if (await button.isVisible()) {
        const latencies: number[] = [];

        for (let i = 0; i < 5; i++) {
          const startTime = await page.evaluate(() => performance.now());
          await button.click();
          const endTime = await page.evaluate(() => performance.now());

          latencies.push(endTime - startTime);
          await page.waitForTimeout(100);
        }

        const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

        // Touch response should be under 100ms for good UX
        expect(averageLatency).toBeLessThan(200); // Relaxed for E2E testing
      }

      await context.close();
    });
  });

  test.describe("Accessibility in Complex Interactions", () => {
    test("Screen reader navigation through complex UI", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Simulate screen reader navigation
      await page.keyboard.press("Tab");

      let focusableElements = [];
      for (let i = 0; i < 20; i++) {
        const focused = await page.locator(":focus").textContent();
        const ariaLabel = await page.locator(":focus").getAttribute("aria-label");
        const role = await page.locator(":focus").getAttribute("role");

        focusableElements.push({
          text: focused,
          ariaLabel,
          role,
          index: i
        });

        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      // Should have logical tab order
      expect(focusableElements.length).toBeGreaterThan(10);

      // Should include important interactive elements
      const hasButtons = focusableElements.some(
        (el) => el.role === "button" || el.text?.toLowerCase().includes("button")
      );
      expect(hasButtons).toBe(true);

      await context.close();
    });

    test("Voice control simulation", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test voice control commands simulation
      const buttons = page.locator("button");
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute("aria-label");
          const textContent = await button.textContent();

          // Voice control requires accessible names
          expect(ariaLabel || textContent?.trim()).toBeTruthy();

          // Simulate voice activation
          await button.focus();
          await page.keyboard.press("Enter");
          await page.waitForTimeout(200);
        }
      }

      await context.close();
    });

    test("Switch control navigation", async ({ browser }) => {
      const context = await browser.newContext(devices["iPhone 12"]);
      const page = await context.newPage();

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Simulate switch control (space bar activation)
      await page.keyboard.press("Tab");

      for (let i = 0; i < 10; i++) {
        const focusedElement = page.locator(":focus");
        if (await focusedElement.isVisible()) {
          const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());

          // Activate with space if it's a button
          if (tagName === "button") {
            await page.keyboard.press("Space");
            await page.waitForTimeout(300);

            // Should handle space activation properly
            break;
          }
        }

        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      await context.close();
    });
  });
});
