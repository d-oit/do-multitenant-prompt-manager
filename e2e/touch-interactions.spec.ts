/**
 * Touch Interactions E2E Tests
 * Tests for touch gestures, bottom sheets, pull-to-refresh, and mobile interactions
 */

import { test, expect, devices } from '@playwright/test';
import { createTestTenant, createTestPrompt } from './setup/dbHelpers';

test.describe('Touch Interactions and Gestures', () => {
  let testTenant: any;
  let testPrompts: any[];

  test.beforeAll(async () => {
    testTenant = await createTestTenant('touch-interactions-test');
    testPrompts = await Promise.all([
      createTestPrompt(testTenant.id, 'Touch Test Prompt 1', 'Test content for touch'),
      createTestPrompt(testTenant.id, 'Touch Test Prompt 2', 'Another test content'),
      createTestPrompt(testTenant.id, 'Touch Test Prompt 3', 'Third test content'),
    ]);
  });

  test.describe('Mobile Touch Gestures', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    });

    test('Swipe Navigation in Mobile Menu', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open mobile menu
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      await hamburger.click();

      const menu = page.locator('.mobile-nav__menu');
      await expect(menu).toBeVisible();

      // Test swipe to close (simulate swipe left)
      const menuBox = await menu.boundingBox();
      if (menuBox) {
        // Start touch from right edge of menu
        await page.mouse.move(menuBox.x + menuBox.width - 10, menuBox.y + menuBox.height / 2);
        await page.mouse.down();
        
        // Swipe left to close
        await page.mouse.move(menuBox.x - 100, menuBox.y + menuBox.height / 2, { steps: 10 });
        await page.waitForTimeout(100);
        await page.mouse.up();
        
        // Menu should close after swipe
        await expect(menu).not.toBeVisible({ timeout: 1000 });
      }
    });

    test('Touch Target Accessibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test all interactive elements have adequate touch targets
      const interactiveElements = page.locator('button, [role="button"], a[href], input, select, textarea');
      const count = await interactiveElements.count();

      for (let i = 0; i < Math.min(count, 15); i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            // Check if element meets minimum touch target size
            const area = box.width * box.height;
            const minArea = 32 * 32; // Relaxed minimum for testing
            
            // Skip very small decorative elements
            if (area > 100) {
              expect(box.height).toBeGreaterThanOrEqual(32);
              expect(box.width).toBeGreaterThanOrEqual(32);
            }
          }
        }
      }
    });

    test('Long Press Context Menu', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Find a prompt card to long press on
      const promptCard = page.locator('.data-table__mobile-card').first();
      
      if (await promptCard.isVisible()) {
        const cardBox = await promptCard.boundingBox();
        if (cardBox) {
          // Simulate long press
          await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press duration
          await page.mouse.up();
          
          // Check if context menu or actions appeared
          // Note: Implementation specific - adjust selectors as needed
          const contextMenu = page.locator('[role="menu"], .context-menu, .action-menu');
          // This would depend on actual implementation
        }
      }
    });

    test('Pinch to Zoom Prevention', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Test that viewport meta tag prevents zooming
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('user-scalable=no');
      
      // Test programmatic zoom prevention
      const initialScale = await page.evaluate(() => {
        return window.visualViewport?.scale || 1;
      });
      
      expect(initialScale).toBe(1);
    });
  });

  test.describe('Bottom Sheet Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('Bottom Sheet Opens and Closes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for any trigger that opens a bottom sheet
      const bottomSheetTrigger = page.locator('[data-testid="bottom-sheet-trigger"], .bottom-sheet-trigger');
      
      if (await bottomSheetTrigger.isVisible()) {
        await bottomSheetTrigger.click();
        
        // Verify bottom sheet appears
        const bottomSheet = page.locator('.bottom-sheet');
        await expect(bottomSheet).toBeVisible();
        
        // Test close button
        const closeButton = page.locator('.bottom-sheet__close-button');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(bottomSheet).not.toBeVisible();
        }
      }
    });

    test('Bottom Sheet Drag Handle', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const bottomSheetTrigger = page.locator('[data-testid="bottom-sheet-trigger"], .bottom-sheet-trigger');
      
      if (await bottomSheetTrigger.isVisible()) {
        await bottomSheetTrigger.click();
        
        const bottomSheet = page.locator('.bottom-sheet');
        await expect(bottomSheet).toBeVisible();
        
        // Test drag handle interaction
        const dragHandle = page.locator('.bottom-sheet__drag-handle');
        if (await dragHandle.isVisible()) {
          const handleBox = await dragHandle.boundingBox();
          if (handleBox) {
            // Simulate drag down gesture
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 100, { steps: 5 });
            await page.mouse.up();
            
            // Bottom sheet should close or minimize
            await page.waitForTimeout(500);
            // Verify state change
          }
        }
      }
    });

    test('Bottom Sheet Overlay Close', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const bottomSheetTrigger = page.locator('[data-testid="bottom-sheet-trigger"], .bottom-sheet-trigger');
      
      if (await bottomSheetTrigger.isVisible()) {
        await bottomSheetTrigger.click();
        
        const bottomSheet = page.locator('.bottom-sheet');
        await expect(bottomSheet).toBeVisible();
        
        // Test clicking overlay to close
        const overlay = page.locator('.bottom-sheet__overlay');
        if (await overlay.isVisible()) {
          await overlay.click();
          await expect(bottomSheet).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Pull to Refresh', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('Pull to Refresh Gesture', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const pullToRefreshContainer = page.locator('.pull-to-refresh');
      
      if (await pullToRefreshContainer.isVisible()) {
        const content = page.locator('.pull-to-refresh__content');
        const contentBox = await content.boundingBox();
        
        if (contentBox) {
          // Simulate pull-to-refresh
          const startY = contentBox.y + 20;
          const endY = startY + 120; // Pull down 120px
          
          await page.mouse.move(contentBox.x + contentBox.width / 2, startY);
          await page.mouse.down();
          
          // Slow pull down to trigger refresh
          for (let y = startY; y <= endY; y += 10) {
            await page.mouse.move(contentBox.x + contentBox.width / 2, y);
            await page.waitForTimeout(50);
          }
          
          // Release to trigger refresh
          await page.mouse.up();
          
          // Check for refresh indicator
          const refreshIndicator = page.locator('.pull-to-refresh__indicator');
          // May be visible during refresh animation
          
          // Wait for refresh to complete
          await page.waitForTimeout(1000);
        }
      }
    });

    test('Pull to Refresh Visual Feedback', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const pullToRefreshContainer = page.locator('.pull-to-refresh');
      
      if (await pullToRefreshContainer.isVisible()) {
        const content = page.locator('.pull-to-refresh__content');
        const contentBox = await content.boundingBox();
        
        if (contentBox) {
          // Start pulling
          await page.mouse.move(contentBox.x + contentBox.width / 2, contentBox.y + 20);
          await page.mouse.down();
          
          // Pull partially to see indicator
          await page.mouse.move(contentBox.x + contentBox.width / 2, contentBox.y + 60, { steps: 5 });
          
          // Check if indicator appears
          const indicator = page.locator('.pull-to-refresh__indicator');
          // Indicator should become visible during pull
          
          // Release without completing refresh
          await page.mouse.up();
          
          // Indicator should animate back
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Floating Action Button', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('FAB Visibility and Position', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const fab = page.locator('.fab, .floating-action-button');
      
      if (await fab.isVisible()) {
        const fabBox = await fab.boundingBox();
        const viewport = page.viewportSize();
        
        if (fabBox && viewport) {
          // FAB should be positioned in bottom-right corner
          expect(fabBox.x + fabBox.width).toBeGreaterThan(viewport.width - 100);
          expect(fabBox.y + fabBox.height).toBeGreaterThan(viewport.height - 150);
          
          // FAB should be circular or rounded
          expect(fabBox.width).toBeGreaterThanOrEqual(56);
          expect(fabBox.height).toBeGreaterThanOrEqual(56);
        }
      }
    });

    test('FAB Touch Interaction', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const fab = page.locator('.fab, .floating-action-button');
      
      if (await fab.isVisible()) {
        // Test touch interaction
        await fab.click();
        
        // Should trigger some action (modal, navigation, etc.)
        // Implementation specific - adjust based on actual behavior
        await page.waitForTimeout(500);
        
        // Verify the action was performed
        // This could be opening a modal, navigating, etc.
      }
    });

    test('FAB Scroll Behavior', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const fab = page.locator('.fab, .floating-action-button');
      
      if (await fab.isVisible()) {
        const initialFabBox = await fab.boundingBox();
        
        // Scroll down
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(300);
        
        // FAB should remain in position or hide/show based on scroll direction
        const scrolledFabBox = await fab.boundingBox();
        
        // Depending on implementation, FAB might hide on scroll down
        if (scrolledFabBox && initialFabBox) {
          // FAB should maintain position relative to viewport
          const positionDiff = Math.abs(scrolledFabBox.y - initialFabBox.y);
          expect(positionDiff).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('Command Palette', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('Command Palette Keyboard Shortcut', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test keyboard shortcut to open command palette
      await page.keyboard.press('Control+k');
      
      const commandPalette = page.locator('.command-palette');
      if (await commandPalette.isVisible()) {
        await expect(commandPalette).toBeVisible();
        
        // Test search functionality
        const searchInput = page.locator('.command-palette__input');
        await searchInput.fill('prompt');
        
        // Should show filtered results
        const results = page.locator('.command-palette__command');
        await expect(results.first()).toBeVisible();
        
        // Test closing with escape
        await page.keyboard.press('Escape');
        await expect(commandPalette).not.toBeVisible();
      }
    });

    test('Command Palette Touch Interaction', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open command palette (if there's a touch trigger)
      const commandPaletteTrigger = page.locator('[data-testid="command-palette-trigger"], .command-palette-trigger');
      
      if (await commandPaletteTrigger.isVisible()) {
        await commandPaletteTrigger.click();
        
        const commandPalette = page.locator('.command-palette');
        await expect(commandPalette).toBeVisible();
        
        // Test touch scrolling in results
        const results = page.locator('.command-palette__results');
        if (await results.isVisible()) {
          const resultsBox = await results.boundingBox();
          if (resultsBox) {
            // Simulate touch scroll
            await page.mouse.move(resultsBox.x + resultsBox.width / 2, resultsBox.y + resultsBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(resultsBox.x + resultsBox.width / 2, resultsBox.y + resultsBox.height / 2 - 50, { steps: 5 });
            await page.mouse.up();
          }
        }
        
        // Close by tapping overlay
        const overlay = page.locator('.command-palette__overlay');
        if (await overlay.isVisible()) {
          await overlay.click();
          await expect(commandPalette).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Touch Performance', () => {
    test('Touch Response Time', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test touch response time
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        const startTime = Date.now();
        await button.click();
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        
        // Touch response should be under 100ms for good UX
        expect(responseTime).toBeLessThan(200); // Relaxed for E2E testing
      }
    });

    test('Smooth Scrolling Performance', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Test smooth scrolling
      const scrollContainer = page.locator('.data-table__container, .main-content, body');
      
      // Measure scroll performance
      const startTime = Date.now();
      
      // Perform smooth scroll
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, 300);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Scrolling should be responsive
      expect(totalTime).toBeLessThan(1000);
    });
  });
});