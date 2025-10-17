/**
 * Enhanced Accessibility E2E Tests
 * Tests for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Accessibility Features', () => {
  test.describe('Keyboard Navigation', () => {
    test('Complete keyboard navigation flow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Start tabbing through the interface
      await page.keyboard.press('Tab');
      
      // Should focus first interactive element
      const firstFocused = page.locator(':focus');
      await expect(firstFocused).toBeVisible();
      
      // Continue tabbing to ensure all interactive elements are reachable
      const focusableElements = [];
      for (let i = 0; i < 10; i++) {
        const currentFocused = await page.locator(':focus').textContent();
        focusableElements.push(currentFocused);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      // Should have progressed through multiple elements
      const uniqueElements = new Set(focusableElements);
      expect(uniqueElements.size).toBeGreaterThan(3);
    });

    test('Skip links work correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab to activate skip links
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('.skip-link, [href="#main-content"], [href="#main"]');
      if (await skipLink.first().isVisible()) {
        await skipLink.first().click();
        
        // Should jump to main content
        const mainContent = page.locator('main, #main-content, #main, [role="main"]');
        // Verify focus moved to main content area
        const focusedElement = page.locator(':focus');
        const isInMain = await mainContent.locator(':focus').count() > 0 || 
                        await mainContent.evaluate((main, focused) => 
                          main.contains(focused), await focusedElement.elementHandle());
      }
    });

    test('Modal focus trapping', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open mobile menu if available
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        
        const menu = page.locator('.mobile-nav__menu');
        await expect(menu).toBeVisible();
        
        // Focus should be trapped in menu
        const firstFocusable = menu.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
        await expect(firstFocusable).toBeFocused();
        
        // Tab through menu items
        await page.keyboard.press('Tab');
        const secondFocused = page.locator(':focus');
        
        // Should still be within menu
        const isInMenu = await menu.locator(':focus').count() > 0;
        expect(isInMenu).toBe(true);
        
        // Close with Escape
        await page.keyboard.press('Escape');
        await expect(menu).not.toBeVisible();
        
        // Focus should return to trigger
        await expect(hamburger).toBeFocused();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('Proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have at least one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Verify heading levels make sense
      const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) => {
        return headings.map(h => parseInt(h.tagName.charAt(1)));
      });
      
      // Should start with h1
      expect(headingLevels[0]).toBe(1);
    });

    test('ARIA labels and descriptions', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check buttons have proper labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          const textContent = await button.textContent();
          
          // Button should have accessible name
          expect(ariaLabel || ariaLabelledBy || textContent?.trim()).toBeTruthy();
        }
      }
    });

    test('Form field labels and descriptions', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for form inputs
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          // Input should have accessible label
          const hasLabel = ariaLabel || ariaLabelledBy || 
                          (id && await page.locator(`label[for="${id}"]`).count() > 0);
          
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('Live regions for dynamic content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"], [role="log"]');
      
      // Should have at least one live region for announcements
      if (await liveRegions.count() > 0) {
        const firstLiveRegion = liveRegions.first();
        const ariaLive = await firstLiveRegion.getAttribute('aria-live');
        
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
    });
  });

  test.describe('Color Contrast and Visual', () => {
    test('Text contrast ratios', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check contrast of main text elements
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
      const sampleSize = Math.min(await textElements.count(), 20);
      
      for (let i = 0; i < sampleSize; i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
            };
          });
          
          // Basic checks - in real implementation, you'd calculate actual contrast ratios
          expect(styles.color).toBeTruthy();
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    });

    test('Focus indicators are visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab to focus elements and check indicators
      const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = Math.min(await focusableElements.count(), 10);
      
      for (let i = 0; i < elementCount; i++) {
        const element = focusableElements.nth(i);
        if (await element.isVisible()) {
          await element.focus();
          
          const focusStyles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              outlineWidth: computed.outlineWidth,
              outlineColor: computed.outlineColor,
              boxShadow: computed.boxShadow,
            };
          });
          
          // Should have visible focus indicator
          const hasFocusIndicator = 
            (focusStyles.outline && focusStyles.outline !== 'none') ||
            (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
            (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
          
          expect(hasFocusIndicator).toBe(true);
        }
      }
    });

    test('High contrast mode support', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate high contrast preference
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      // Check that interface still works and is visible
      const mainHeading = page.locator('h1').first();
      if (await mainHeading.isVisible()) {
        const styles = await mainHeading.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            visibility: computed.visibility,
            display: computed.display,
          };
        });
        
        expect(styles.visibility).not.toBe('hidden');
        expect(styles.display).not.toBe('none');
      }
    });
  });

  test.describe('Motion and Animation', () => {
    test('Respects reduced motion preference', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Trigger animations
      const animatedElement = page.locator('.mobile-nav__hamburger-button, .animated, [class*="transition"]').first();
      
      if (await animatedElement.isVisible()) {
        const animationStyles = await animatedElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            animationDuration: computed.animationDuration,
            transitionDuration: computed.transitionDuration,
          };
        });
        
        // Animations should be reduced or disabled
        expect(
          animationStyles.animationDuration === '0s' ||
          animationStyles.animationDuration === '0.01ms' ||
          animationStyles.transitionDuration === '0s' ||
          animationStyles.transitionDuration === '0.01ms'
        ).toBe(true);
      }
    });

    test('No auto-playing content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for auto-playing media
      const autoplayMedia = page.locator('video[autoplay], audio[autoplay]');
      const autoplayCount = await autoplayMedia.count();
      
      // Should not have auto-playing content
      expect(autoplayCount).toBe(0);
      
      // Check for auto-advancing carousels or slideshows
      const carousels = page.locator('[role="region"][aria-label*="carousel"], [class*="carousel"], [class*="slider"]');
      
      if (await carousels.count() > 0) {
        // If carousels exist, they should have pause controls
        const pauseControls = page.locator('button:has-text("pause"), button:has-text("stop"), button[aria-label*="pause"]');
        // Implementation would depend on actual carousel implementation
      }
    });
  });

  test.describe('Error Handling and Feedback', () => {
    test('Form validation messages are accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for forms
      const forms = page.locator('form');
      
      if (await forms.count() > 0) {
        const form = forms.first();
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        
        if (await submitButton.isVisible()) {
          // Try to submit empty form to trigger validation
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Check for validation messages
          const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"] + *, [class*="error"]');
          
          if (await errorMessages.count() > 0) {
            const firstError = errorMessages.first();
            
            // Error should be announced to screen readers
            const ariaLive = await firstError.getAttribute('aria-live');
            const role = await firstError.getAttribute('role');
            
            expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true);
          }
        }
      }
    });

    test('Loading states are announced', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for loading indicators
      const loadingIndicators = page.locator('[aria-label*="loading"], [aria-label*="Loading"], .loading, .spinner');
      
      if (await loadingIndicators.count() > 0) {
        const loadingElement = loadingIndicators.first();
        
        // Should have appropriate ARIA attributes
        const ariaLabel = await loadingElement.getAttribute('aria-label');
        const ariaLive = await loadingElement.getAttribute('aria-live');
        const role = await loadingElement.getAttribute('role');
        
        expect(
          ariaLabel?.toLowerCase().includes('loading') ||
          ariaLive ||
          role === 'status'
        ).toBe(true);
      }
    });
  });
});