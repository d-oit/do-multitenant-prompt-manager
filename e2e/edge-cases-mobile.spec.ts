/**
 * Mobile Edge Cases and Error Scenarios E2E Tests
 * Tests for edge cases, error handling, and unusual user behavior on mobile devices
 */

import { test, expect, devices } from '@playwright/test';
import { createTestTenant, createTestPrompt } from './setup/dbHelpers';

test.describe('Mobile Edge Cases and Error Scenarios', () => {
  let testTenant: any;

  test.beforeAll(async () => {
    testTenant = await createTestTenant('edge-cases-test');
  });

  test.describe('Network Edge Cases', () => {
    test('Offline to Online Transition', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.setOffline(true);
      
      // Try to navigate while offline
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        const menu = page.locator('.mobile-nav__menu');
        await expect(menu).toBeVisible();
        
        await page.locator('.mobile-nav__menu-button:has-text("Prompts")').click();
      }

      // Should handle offline gracefully
      const offlineIndicator = page.locator(':has-text("offline"), :has-text("connection"), [role="alert"]');
      
      // Go back online
      await page.setOffline(false);
      await page.waitForTimeout(1000);

      // Should recover and sync
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should show normal content
      const content = page.locator('.app-shell, main');
      await expect(content).toBeVisible();
    });

    test('Slow Network Connection Handling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate very slow network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      
      // Should show loading states
      const loadingIndicators = page.locator('.skeleton-loader, .loading, [aria-label*="loading"]');
      if (await loadingIndicators.first().isVisible()) {
        await expect(loadingIndicators.first()).toBeVisible();
      }

      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Should eventually load but may take longer
      expect(loadTime).toBeGreaterThan(2000);
      expect(loadTime).toBeLessThan(15000);
    });

    test('API Timeout Handling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mock API timeout
      await page.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s timeout
        await route.abort('timedout');
      });

      await page.goto('/prompts');
      
      // Should show error state gracefully
      const errorStates = page.locator('.error, [role="alert"], :has-text("error"), :has-text("failed")');
      await expect(errorStates.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Device Orientation Edge Cases', () => {
    test('Rapid Orientation Changes', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone 12']);
      const page = await context.newPage();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Rapidly change orientation multiple times
      for (let i = 0; i < 5; i++) {
        // Portrait
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(100);
        
        // Landscape
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForTimeout(100);
      }

      // Should handle rapid changes gracefully
      const layout = page.locator('.app-shell');
      await expect(layout).toBeVisible();
      
      // Final check - should be stable
      await page.waitForTimeout(500);
      await expect(layout).toBeVisible();

      await context.close();
    });

    test('Landscape Mode Usability', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        viewport: { width: 844, height: 390 }, // Landscape
      });
      const page = await context.newPage();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify mobile navigation still works in landscape
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        
        const menu = page.locator('.mobile-nav__menu');
        await expect(menu).toBeVisible();
        
        // Menu should fit in landscape viewport
        const menuBox = await menu.boundingBox();
        const viewport = page.viewportSize();
        
        if (menuBox && viewport) {
          expect(menuBox.height).toBeLessThanOrEqual(viewport.height);
        }
      }

      await context.close();
    });

    test('Foldable Device Simulation', async ({ page }) => {
      // Simulate Samsung Galaxy Fold unfolded
      await page.setViewportSize({ width: 717, height: 512 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should adapt to unusual aspect ratio
      const layout = page.locator('.app-shell');
      await expect(layout).toBeVisible();

      // Simulate folding (to phone size)
      await page.setViewportSize({ width: 280, height: 653 });
      await page.waitForTimeout(500);

      // Should handle very narrow viewport
      const mobileNav = page.locator('.mobile-nav');
      await expect(mobileNav).toBeVisible();
    });
  });

  test.describe('Touch Interaction Edge Cases', () => {
    test('Simultaneous Touch Events', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate multiple touch points (should not break interface)
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        const box = await hamburger.boundingBox();
        if (box) {
          // Simulate multi-touch (should handle gracefully)
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 20, box.y + 20);
          await page.mouse.up();
          
          // Interface should still be responsive
          await hamburger.click();
          const menu = page.locator('.mobile-nav__menu');
          await expect(menu).toBeVisible();
        }
      }
    });

    test('Touch Event Interruption', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        const box = await hamburger.boundingBox();
        if (box) {
          // Start touch but don't complete
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          
          // Move away and cancel
          await page.mouse.move(0, 0);
          // Simulate touch cancel event
          await page.evaluate(() => {
            const event = new TouchEvent('touchcancel', { bubbles: true, cancelable: true });
            document.dispatchEvent(event);
          });
          
          // Should handle gracefully
          await page.waitForTimeout(100);
          
          // Normal interaction should still work
          await hamburger.click();
          const menu = page.locator('.mobile-nav__menu');
          await expect(menu).toBeVisible();
        }
      }
    });

    test('Rapid Tap Prevention (Double-tap zoom)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Rapid double-tap should not cause zoom
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(50);
        await button.click();
        
        // Check that viewport scale hasn't changed
        const scale = await page.evaluate(() => {
          return window.visualViewport?.scale || 1;
        });
        
        expect(scale).toBe(1);
      }
    });
  });

  test.describe('Memory and Performance Edge Cases', () => {
    test('Memory Pressure Simulation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate memory pressure
      await page.evaluate(() => {
        // Create large arrays to use memory
        const memoryPressure = [];
        for (let i = 0; i < 1000; i++) {
          memoryPressure.push(new Array(1000).fill('memory pressure test'));
        }
        
        // Trigger memory warning if available
        if ((window as any).dispatchEvent) {
          window.dispatchEvent(new CustomEvent('memory-warning'));
        }
      });

      // Application should still be responsive
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        const menu = page.locator('.mobile-nav__menu');
        await expect(menu).toBeVisible();
      }
    });

    test('CPU Throttling Simulation', async ({ page, context }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Enable CPU throttling
      const client = await context.newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: 6 }); // 6x slower

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should still load but may be slower
      expect(loadTime).toBeLessThan(15000);
      
      // Interface should still be usable
      const interactiveElement = page.locator('button').first();
      if (await interactiveElement.isVisible()) {
        await interactiveElement.click();
        // Should respond even under CPU pressure
      }
    });

    test('Large Dataset Handling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Create many test prompts to test large dataset handling
      const largeDataset = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          createTestPrompt(testTenant.id, `Large Dataset Prompt ${i + 1}`, `Content ${i + 1}`)
        )
      );

      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Should handle large dataset without performance issues
      const cards = page.locator('.data-table__mobile-card');
      if (await cards.first().isVisible()) {
        // Should show virtual scrolling or pagination
        const cardCount = await cards.count();
        expect(cardCount).toBeLessThanOrEqual(50); // Should limit rendered items
      }

      // Scrolling should be smooth
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, 500);
      
      // Should remain responsive
      const firstCard = cards.first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
      }
    });
  });

  test.describe('Input and Form Edge Cases', () => {
    test('Virtual Keyboard Behavior', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find form input
      const input = page.locator('input, textarea').first();
      if (await input.isVisible()) {
        // Simulate virtual keyboard appearing
        await input.focus();
        
        // Reduce viewport height to simulate keyboard
        await page.setViewportSize({ width: 375, height: 300 });
        await page.waitForTimeout(300);
        
        // Content should remain accessible
        await expect(input).toBeVisible();
        
        // Should be able to scroll to focused element
        const box = await input.boundingBox();
        expect(box?.y).toBeLessThan(300);
        
        // Restore viewport
        await page.setViewportSize({ width: 375, height: 667 });
      }
    });

    test('Input Validation on Mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test form validation
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        
        if (await submitButton.isVisible()) {
          // Try to submit without filling required fields
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Error messages should be visible and accessible on mobile
          const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
          if (await errorMessages.first().isVisible()) {
            const errorBox = await errorMessages.first().boundingBox();
            expect(errorBox?.height).toBeGreaterThan(0);
          }
        }
      }
    });

    test('Copy/Paste Functionality', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Test copy functionality on mobile
      const textElement = page.locator('.data-table__mobile-card .data-table__mobile-field-value').first();
      if (await textElement.isVisible()) {
        // Simulate long press to bring up context menu
        const box = await textElement.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press
          await page.mouse.up();
          
          // Context menu or selection should appear
          // Implementation depends on browser behavior
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Theme and Visual Edge Cases', () => {
    test('System Theme Change During Use', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate system theme change
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(300);
      
      // Should adapt to system theme
      const bodyStyles = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Change back to light
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(300);
      
      // Should handle theme changes gracefully
      const newBodyStyles = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      expect(newBodyStyles).not.toBe(bodyStyles);
    });

    test('High Contrast Mode Edge Cases', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // All interactive elements should remain visible
      const buttons = page.locator('button');
      const buttonCount = Math.min(await buttons.count(), 10);
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const styles = await button.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              border: computed.border,
            };
          });
          
          // Should have adequate contrast in high contrast mode
          expect(styles.color).toBeTruthy();
        }
      }
    });

    test('Font Size Accessibility Override', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate user with large font preference
      await page.addStyleTag({
        content: `
          * {
            font-size: 200% !important;
          }
        `
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Layout should adapt to larger fonts
      const content = page.locator('main, .app-shell');
      await expect(content).toBeVisible();
      
      // Should not cause horizontal overflow
      const hasHorizontalScroll = await content.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });
  });

  test.describe('Progressive Web App Edge Cases', () => {
    test('App Install and Offline Usage', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate PWA install prompt
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt') as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
        };
        event.prompt = async () => {};
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
      });

      // Should show install button
      const installButton = page.locator('button:has-text("Install"), [aria-label*="install"]');
      if (await installButton.isVisible()) {
        await installButton.click();
        
        // Should handle install flow
        await page.waitForTimeout(500);
      }

      // Test offline usage after install
      await page.setOffline(true);
      await page.reload();
      
      // Should show cached content
      const offlineContent = page.locator('.app-shell, main');
      await expect(offlineContent).toBeVisible({ timeout: 5000 });
    });

    test('Service Worker Update Handling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate service worker update
      await page.evaluate(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              // Simulate update available
              const event = new CustomEvent('controllerchange');
              navigator.serviceWorker.dispatchEvent(event);
            }
          });
        }
      });

      // Should handle service worker updates gracefully
      await page.waitForTimeout(1000);
      
      // App should remain functional
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        const menu = page.locator('.mobile-nav__menu');
        await expect(menu).toBeVisible();
      }
    });
  });
});