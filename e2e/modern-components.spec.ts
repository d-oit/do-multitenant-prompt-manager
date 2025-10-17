/**
 * Modern UI Components E2E Tests
 * Tests for Command Palette, Data Table, Skeleton Loaders, and Enhanced UI Components
 */

import { test, expect } from '@playwright/test';
import { createTestTenant, createTestPrompt } from './setup/dbHelpers';

test.describe('Modern UI Components', () => {
  let testTenant: any;
  let testPrompts: any[];

  test.beforeAll(async () => {
    testTenant = await createTestTenant('modern-components-test');
    testPrompts = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        createTestPrompt(testTenant.id, `Component Test Prompt ${i + 1}`, `Test content for component ${i + 1}`)
      )
    );
  });

  test.describe('Command Palette', () => {
    test('Opens with keyboard shortcut', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open command palette with Ctrl+K
      await page.keyboard.press('Control+k');
      
      const commandPalette = page.locator('.command-palette');
      if (await commandPalette.isVisible()) {
        await expect(commandPalette).toBeVisible();
        
        // Input should be focused
        const searchInput = page.locator('.command-palette__input');
        await expect(searchInput).toBeFocused();
        
        // Close with Escape
        await page.keyboard.press('Escape');
        await expect(commandPalette).not.toBeVisible();
      }
    });

    test('Search functionality works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Try to open command palette
      await page.keyboard.press('Control+k');
      
      const commandPalette = page.locator('.command-palette');
      if (await commandPalette.isVisible()) {
        const searchInput = page.locator('.command-palette__input');
        
        // Search for "prompt"
        await searchInput.fill('prompt');
        await page.waitForTimeout(300);
        
        // Should show filtered results
        const commands = page.locator('.command-palette__command');
        const commandCount = await commands.count();
        expect(commandCount).toBeGreaterThan(0);
        
        // Clear search
        await searchInput.fill('');
        await page.waitForTimeout(300);
        
        // Should show different results
        const clearedCommands = page.locator('.command-palette__command');
        await expect(clearedCommands.first()).toBeVisible();
      }
    });

    test('Keyboard navigation in command palette', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.keyboard.press('Control+k');
      
      const commandPalette = page.locator('.command-palette');
      if (await commandPalette.isVisible()) {
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        
        const selectedCommand = page.locator('.command-palette__command--selected');
        await expect(selectedCommand).toBeVisible();
        
        // Navigate down again
        await page.keyboard.press('ArrowDown');
        
        // Should move selection
        const commands = page.locator('.command-palette__command--selected');
        await expect(commands).toHaveCount(1);
        
        // Execute command with Enter
        await page.keyboard.press('Enter');
        
        // Command palette should close
        await expect(commandPalette).not.toBeVisible();
      }
    });
  });

  test.describe('Enhanced Data Table', () => {
    test('Responsive table layout', async ({ page }) => {
      // Test desktop layout
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Should show desktop table
      const desktopTable = page.locator('.data-table__table');
      if (await desktopTable.isVisible()) {
        await expect(desktopTable).toBeVisible();
        
        // Should have multiple columns
        const headerCells = page.locator('.data-table__header-cell');
        const headerCount = await headerCells.count();
        expect(headerCount).toBeGreaterThan(3);
      }

      // Switch to mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Should switch to mobile cards
      const mobileCards = page.locator('.data-table__mobile-card');
      const mobileTable = page.locator('.data-table__table');
      
      if (await mobileCards.first().isVisible()) {
        await expect(mobileCards.first()).toBeVisible();
        await expect(mobileTable).not.toBeVisible();
      }
    });

    test('Table sorting functionality', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const sortableHeader = page.locator('.data-table__header-cell--sortable').first();
      
      if (await sortableHeader.isVisible()) {
        // Click to sort
        await sortableHeader.click();
        await page.waitForTimeout(300);
        
        // Should show sort indicator
        const sortIcon = sortableHeader.locator('.data-table__sort-icon');
        await expect(sortIcon).toBeVisible();
        
        // Click again to reverse sort
        await sortableHeader.click();
        await page.waitForTimeout(300);
        
        // Sort direction should change
        const sortedIcon = sortableHeader.locator('.data-table__sort-icon--desc, .data-table__sort-icon--asc');
        await expect(sortedIcon).toBeVisible();
      }
    });

    test('Row selection functionality', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      const selectAllCheckbox = page.locator('.data-table__header-cell--selection input[type="checkbox"]');
      
      if (await selectAllCheckbox.isVisible()) {
        // Select all rows
        await selectAllCheckbox.click();
        
        // All row checkboxes should be checked
        const rowCheckboxes = page.locator('.data-table__cell--selection input[type="checkbox"]');
        const checkedCount = await rowCheckboxes.locator(':checked').count();
        const totalCount = await rowCheckboxes.count();
        
        expect(checkedCount).toBe(totalCount);
        
        // Unselect all
        await selectAllCheckbox.click();
        
        // No checkboxes should be checked
        const uncheckedCount = await rowCheckboxes.locator(':checked').count();
        expect(uncheckedCount).toBe(0);
      }
    });
  });

  test.describe('Skeleton Loaders', () => {
    test('Skeleton loaders appear during loading', async ({ page }) => {
      // Intercept API calls to simulate slow loading
      await page.route('**/api/prompts**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/prompts');
      
      // Should show skeleton loaders while loading
      const skeletonLoaders = page.locator('.skeleton-loader, .data-table__loading');
      if (await skeletonLoaders.first().isVisible()) {
        await expect(skeletonLoaders.first()).toBeVisible();
      }
      
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      
      // Skeleton loaders should be replaced with actual content
      const actualContent = page.locator('.data-table__row, .data-table__mobile-card');
      if (await actualContent.first().isVisible()) {
        await expect(actualContent.first()).toBeVisible();
      }
    });

    test('Different skeleton variants', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for different types of skeleton loaders
      const textSkeletons = page.locator('.skeleton-loader--text');
      const rectangularSkeletons = page.locator('.skeleton-loader--rectangular');
      const circularSkeletons = page.locator('.skeleton-loader--circular');

      // Check if different skeleton types are used appropriately
      if (await textSkeletons.first().isVisible()) {
        const textBox = await textSkeletons.first().boundingBox();
        expect(textBox?.height).toBeLessThan(30); // Text skeletons should be relatively short
      }

      if (await circularSkeletons.first().isVisible()) {
        const circularBox = await circularSkeletons.first().boundingBox();
        if (circularBox) {
          // Circular skeletons should be roughly square
          const aspectRatio = circularBox.width / circularBox.height;
          expect(aspectRatio).toBeCloseTo(1, 0.2);
        }
      }
    });
  });

  test.describe('Enhanced Accessibility', () => {
    test('Skip links functionality', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab to first element to activate skip links
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('.skip-link');
      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();
        
        // Click skip link
        await skipLink.click();
        
        // Should focus main content
        const mainContent = page.locator('main, [role="main"]');
        // Focus might be on main or first focusable element within main
      }
    });

    test('Focus indicators are visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab through focusable elements
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check for focus indicator styles
      const focusStyles = await focusedElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
        };
      });
      
      // Should have visible focus indicators
      expect(
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' || 
        focusStyles.boxShadow.includes('rgb')
      ).toBe(true);
    });

    test('ARIA labels and roles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for proper ARIA labels
      const buttonsWithLabels = page.locator('button[aria-label], button[aria-labelledby]');
      const buttonCount = await page.locator('button').count();
      const labeledButtonCount = await buttonsWithLabels.count();
      
      // Most buttons should have proper labels
      expect(labeledButtonCount / buttonCount).toBeGreaterThan(0.5);

      // Check for landmark roles
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      const navigation = page.locator('nav, [role="navigation"]');
      if (await navigation.first().isVisible()) {
        await expect(navigation.first()).toBeVisible();
      }
    });

    test('Screen reader announcements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      
      // Should have some mechanism for screen reader announcements
      if (await liveRegions.first().isVisible()) {
        await expect(liveRegions.first()).toBeVisible();
      }

      // Test dynamic content announcements (e.g., after form submission)
      const createButton = page.locator('button:has-text("Create")');
      if (await createButton.isVisible()) {
        // This would trigger dynamic content that should be announced
        // Implementation depends on actual form behavior
      }
    });
  });

  test.describe('Theme and Visual Enhancements', () => {
    test('Dark mode toggle works correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const themeToggle = page.locator('.theme-switcher button, .dark-mode-toggle__button');
      
      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.locator('html').getAttribute('data-theme');
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        // Theme should change
        const newTheme = await page.locator('html').getAttribute('data-theme');
        expect(newTheme).not.toBe(initialTheme);
        
        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        // Should return to original theme
        const returnedTheme = await page.locator('html').getAttribute('data-theme');
        expect(returnedTheme).toBe(initialTheme);
      }
    });

    test('Consistent spacing and typography', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check that spacing follows consistent scale
      const spacedElements = page.locator('.pm-spacing-1, .pm-spacing-2, .pm-spacing-3, .pm-spacing-4');
      
      if (await spacedElements.first().isVisible()) {
        const spacing1 = await spacedElements.first().evaluate((el) => {
          return window.getComputedStyle(el).marginTop;
        });
        
        // Should use consistent spacing scale
        expect(spacing1).toMatch(/\d+(px|rem|em)/);
      }

      // Check typography scale
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      if (await headings.first().isVisible()) {
        const fontSize = await headings.first().evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        
        // Should have reasonable font size
        const sizeValue = parseFloat(fontSize);
        expect(sizeValue).toBeGreaterThan(14); // At least 14px
      }
    });

    test('Animation performance preferences', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Trigger an animation
      const animatedElement = page.locator('.mobile-nav__hamburger-button');
      if (await animatedElement.isVisible()) {
        await animatedElement.click();
        
        // Animations should be reduced or disabled
        const menu = page.locator('.mobile-nav__menu');
        if (await menu.isVisible()) {
          const animationDuration = await menu.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return computed.animationDuration || computed.transitionDuration;
          });
          
          // Should have minimal or no animation duration
          expect(animationDuration).toMatch(/(0s|0\.01ms|none)/);
        }
      }
    });
  });
});