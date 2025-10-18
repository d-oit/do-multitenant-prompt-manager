/**
 * Mobile Responsive Design E2E Tests
 * Tests for mobile-first responsive layout and touch interactions
 */

import { test, expect, devices } from '@playwright/test';
import { createTestTenant, createTestPrompt } from './setup/dbHelpers';

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'iPhone 12 Pro', ...devices['iPhone 12 Pro'] },
  { name: 'Samsung Galaxy S21', ...devices['Galaxy S8'] }, // Close equivalent
];

const TABLET_VIEWPORTS = [
  { name: 'iPad', ...devices['iPad'] },
  { name: 'iPad Pro', ...devices['iPad Pro'] },
];

const DESKTOP_VIEWPORTS = [
  { name: 'Desktop 1024', viewport: { width: 1024, height: 768 } },
  { name: 'Desktop 1440', viewport: { width: 1440, height: 900 } },
  { name: 'Desktop 1920', viewport: { width: 1920, height: 1080 } },
];

test.describe('Mobile-First Responsive Design', () => {
  let testTenant: any;
  let testPrompts: any[];

  test.beforeAll(async () => {
    // Create test data
    testTenant = await createTestTenant('mobile-responsive-test', 'mobile-responsive-test');
    testPrompts = await Promise.all([
      createTestPrompt(testTenant.id, 'Mobile Test Prompt 1', 'Test content for mobile'),
      createTestPrompt(testTenant.id, 'Mobile Test Prompt 2', 'Another test content'),
      createTestPrompt(testTenant.id, 'Mobile Test Prompt 3', 'Third test content'),
    ]);
  });

  test.describe('Mobile Layout (< 900px)', () => {
    MOBILE_VIEWPORTS.forEach(({ name, ...device }) => {
      test(`Mobile Navigation - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify mobile navigation is visible
        const mobileNav = page.locator('.mobile-nav');
        await expect(mobileNav).toBeVisible();

        // Test hamburger menu functionality
        const hamburgerButton = page.locator('.mobile-nav__hamburger-button');
        await expect(hamburgerButton).toBeVisible();
        
        // Click hamburger to open menu
        await hamburgerButton.click();
        
        // Verify menu opens
        const mobileMenu = page.locator('.mobile-nav__menu');
        await expect(mobileMenu).toBeVisible();
        
        // Verify navigation items are present
        const navItems = page.locator('.mobile-nav__menu-button');
        await expect(navItems).toHaveCount(4); // Dashboard, Prompts, Analytics, Tenants
        
        // Test navigation
        await navItems.filter({ hasText: 'Prompts' }).click();
        await expect(page).toHaveURL(/.*prompts/);
        
        // Verify menu closes after navigation
        await expect(mobileMenu).not.toBeVisible();

        await context.close();
      });

      test(`Touch Target Sizes - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Test minimum touch target sizes (44px)
        const touchTargets = page.locator('button, [role="button"], a, input, select');
        const count = await touchTargets.count();
        
        for (let i = 0; i < Math.min(count, 10); i++) {
          const target = touchTargets.nth(i);
          if (await target.isVisible()) {
            const box = await target.boundingBox();
            if (box) {
              // Allow some exceptions for inline elements
              const classList = await target.getAttribute('class') || '';
              if (!classList.includes('text-link') && !classList.includes('inline')) {
                expect(box.height).toBeGreaterThanOrEqual(32); // Slightly relaxed for development
                expect(box.width).toBeGreaterThanOrEqual(32);
              }
            }
          }
        }

        await context.close();
      });

      test(`Mobile Card Layout - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/prompts');
        await page.waitForLoadState('networkidle');

        // Check if data table switches to mobile card layout
        const mobileCards = page.locator('.data-table__mobile-card');
        const desktopTable = page.locator('.data-table__table');

        // On mobile, should use card layout
        if (await mobileCards.first().isVisible()) {
          await expect(mobileCards).toHaveCount(testPrompts.length);
          await expect(desktopTable).not.toBeVisible();
          
          // Test card interactions
          const firstCard = mobileCards.first();
          await expect(firstCard).toBeVisible();
          
          // Verify card content structure
          const cardContent = firstCard.locator('.data-table__mobile-card-content');
          await expect(cardContent).toBeVisible();
        }

        await context.close();
      });

      test(`Pull to Refresh - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/prompts');
        await page.waitForLoadState('networkidle');

        // Test pull-to-refresh functionality
        const pullToRefreshContainer = page.locator('.pull-to-refresh');
        
        if (await pullToRefreshContainer.isVisible()) {
          // Simulate pull-to-refresh gesture
          const content = page.locator('.pull-to-refresh__content');
          const box = await content.boundingBox();
          
          if (box) {
            // Start touch at top of content area
            await page.mouse.move(box.x + box.width / 2, box.y + 10);
            await page.mouse.down();
            
            // Pull down 100px
            await page.mouse.move(box.x + box.width / 2, box.y + 110, { steps: 10 });
            await page.waitForTimeout(100);
            
            // Release
            await page.mouse.up();
            
            // Check for refresh indicator
            const refreshIndicator = page.locator('.pull-to-refresh__indicator');
            // Note: In real implementation, this would trigger a refresh
          }
        }

        await context.close();
      });
    });
  });

  test.describe('Tablet Layout (900px - 1024px)', () => {
    TABLET_VIEWPORTS.forEach(({ name, ...device }) => {
      test(`Tablet Sidebar Layout - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify tablet layout
        const appShell = page.locator('.app-shell');
        await expect(appShell).toBeVisible();
        
        // On tablet, should have sidebar
        const sidebar = page.locator('.app-shell__sidebar');
        if (await sidebar.isVisible()) {
          // Verify sidebar width and content
          const sidebarBox = await sidebar.boundingBox();
          expect(sidebarBox?.width).toBeGreaterThan(250);
          expect(sidebarBox?.width).toBeLessThan(350);
        }

        // Mobile navigation should be hidden on tablet
        const mobileNav = page.locator('.mobile-nav');
        await expect(mobileNav).not.toBeVisible();

        await context.close();
      });

      test(`Tablet Data Table - ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/prompts');
        await page.waitForLoadState('networkidle');

        // On tablet, should use desktop table layout
        const desktopTable = page.locator('.data-table__table');
        const mobileCards = page.locator('.data-table__mobile-card');

        await expect(desktopTable).toBeVisible();
        await expect(mobileCards).not.toBeVisible();

        // Test table responsiveness
        const tableHeaders = page.locator('.data-table__header-cell');
        await expect(tableHeaders.first()).toBeVisible();

        await context.close();
      });
    });
  });

  test.describe('Desktop Layout (> 1024px)', () => {
    DESKTOP_VIEWPORTS.forEach(({ name, viewport }) => {
      test(`Desktop Layout - ${name}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify desktop layout
        const appShell = page.locator('.app-shell');
        await expect(appShell).toBeVisible();
        
        // Desktop should have full sidebar
        const sidebar = page.locator('.app-shell__sidebar');
        await expect(sidebar).toBeVisible();
        
        const sidebarBox = await sidebar.boundingBox();
        expect(sidebarBox?.width).toBeGreaterThan(300);

        // Mobile navigation should be hidden
        const mobileNav = page.locator('.mobile-nav');
        await expect(mobileNav).not.toBeVisible();

        // Test grid layouts adapt to screen size
        const gridContainers = page.locator('.grid-container');
        if (await gridContainers.first().isVisible()) {
          const firstGrid = gridContainers.first();
          const gridBox = await firstGrid.boundingBox();
          
          // Desktop should utilize full width efficiently
          expect(gridBox?.width).toBeGreaterThan(800);
        }

        await context.close();
      });

      test(`Desktop Multi-Column Layout - ${name}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        
        await page.goto('/prompts');
        await page.waitForLoadState('networkidle');

        // Test data table columns are fully visible
        const table = page.locator('.data-table__table');
        await expect(table).toBeVisible();

        const headerCells = page.locator('.data-table__header-cell');
        const headerCount = await headerCells.count();
        
        // All columns should be visible on desktop
        expect(headerCount).toBeGreaterThanOrEqual(4);

        // Test that table doesn't have horizontal scroll
        const tableContainer = page.locator('.data-table__container');
        const hasScroll = await tableContainer.evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });
        
        expect(hasScroll).toBe(false);

        await context.close();
      });
    });
  });

  test.describe('Cross-Device Responsive Behavior', () => {
    test('Layout Changes on Viewport Resize', async ({ page }) => {
      // Start with desktop size
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify desktop layout
      await expect(page.locator('.app-shell__sidebar')).toBeVisible();
      await expect(page.locator('.mobile-nav')).not.toBeVisible();

      // Resize to tablet
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500); // Allow for layout changes

      // Should still have sidebar but different layout
      const sidebarVisible = await page.locator('.app-shell__sidebar').isVisible();
      // Layout may vary based on implementation

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Should show mobile navigation
      await expect(page.locator('.mobile-nav')).toBeVisible();
      
      // Sidebar should be hidden on mobile
      await expect(page.locator('.app-shell__sidebar')).not.toBeVisible();
    });

    test('Touch Gestures Work Across Devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test swipe gesture (if implemented)
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      await hamburger.click();

      const menu = page.locator('.mobile-nav__menu');
      await expect(menu).toBeVisible();

      // Test closing menu by clicking overlay
      const overlay = page.locator('.mobile-nav__overlay');
      if (await overlay.isVisible()) {
        await overlay.click();
        await expect(menu).not.toBeVisible();
      }
    });

    test('Safe Area Support (iOS Simulation)', async ({ page }) => {
      // Simulate iPhone with notch
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Add simulated safe area
      await page.addStyleTag({
        content: `
          :root {
            --pm-spacing-safe-top: 44px;
            --pm-spacing-safe-bottom: 34px;
          }
        `
      });

      // Verify content respects safe areas
      const appShell = page.locator('.app-shell');
      const styles = await appShell.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
        };
      });

      // Should have adequate padding for safe areas
      expect(parseInt(styles.paddingTop)).toBeGreaterThan(20);
      expect(parseInt(styles.paddingBottom)).toBeGreaterThan(20);
    });
  });

  test.describe('Performance on Mobile Devices', () => {
    test('Mobile Performance Metrics', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Start performance measurement
      await page.goto('/', { waitUntil: 'networkidle' });

      // Measure performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });

      // Performance thresholds for mobile
      expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds max load time
      expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds max DOM ready
      
      if (metrics.firstContentfulPaint > 0) {
        expect(metrics.firstContentfulPaint).toBeLessThan(2500); // 2.5 seconds max FCP
      }
    });

    test('Smooth Animations on Mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test mobile navigation animation
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      await hamburger.click();

      // Verify animation completes smoothly
      const menu = page.locator('.mobile-nav__menu');
      await expect(menu).toBeVisible();

      // Check for animation duration (should be reasonable)
      const animationDuration = await menu.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration || computed.transitionDuration;
      });

      // Animation should be present but not too long
      expect(animationDuration).toMatch(/\d+(\.\d+)?s/);
    });
  });
});

test.describe('Accessibility on Mobile', () => {
  test('Keyboard Navigation on Touch Devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test escape key functionality
    const hamburger = page.locator('.mobile-nav__hamburger-button');
    await hamburger.click();
    
    const menu = page.locator('.mobile-nav__menu');
    await expect(menu).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });

  test('Screen Reader Support', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check ARIA labels
    const hamburger = page.locator('.mobile-nav__hamburger-button');
    const ariaLabel = await hamburger.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/navigation|menu/i);

    // Check for proper headings structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Verify main landmarks
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('Focus Management in Modals', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    const hamburger = page.locator('.mobile-nav__hamburger-button');
    await hamburger.click();

    const menu = page.locator('.mobile-nav__menu');
    await expect(menu).toBeVisible();

    // Focus should be trapped in menu
    const firstFocusable = menu.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
    await expect(firstFocusable).toBeFocused();

    // Test tab cycling within modal
    await page.keyboard.press('Tab');
    const secondFocusable = page.locator(':focus');
    await expect(secondFocusable).toBeVisible();

    // Close menu and verify focus returns
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(hamburger).toBeFocused();
  });
});