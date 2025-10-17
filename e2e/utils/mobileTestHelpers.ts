/**
 * Mobile Test Helpers
 * Utility functions for mobile-specific E2E testing
 */

import { Page, Locator, expect } from '@playwright/test';

export interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  steps?: number;
  duration?: number;
}

export interface DeviceCapabilities {
  hasTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  supportsHover: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Detect device capabilities from page
 */
export async function getDeviceCapabilities(page: Page): Promise<DeviceCapabilities> {
  const viewport = page.viewportSize();
  const screenWidth = viewport?.width || 1024;
  const screenHeight = viewport?.height || 768;

  const capabilities = await page.evaluate(() => {
    return {
      hasTouch: 'ontouchstart' in window,
      supportsHover: window.matchMedia('(hover: hover)').matches,
    };
  });

  return {
    ...capabilities,
    isMobile: screenWidth < 768,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    screenWidth,
    screenHeight,
  };
}

/**
 * Simulate touch gesture
 */
export async function simulateTouch(page: Page, gesture: TouchGesture): Promise<void> {
  const { startX, startY, endX, endY, steps = 10, duration = 300 } = gesture;
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  
  // Simulate smooth movement
  const stepDelay = duration / steps;
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;
    
    await page.mouse.move(currentX, currentY);
    await page.waitForTimeout(stepDelay);
  }
  
  await page.mouse.up();
}

/**
 * Simulate swipe gesture
 */
export async function simulateSwipe(
  page: Page, 
  element: Locator, 
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 100
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found for swipe');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  let endX = centerX;
  let endY = centerY;

  switch (direction) {
    case 'left':
      endX = centerX - distance;
      break;
    case 'right':
      endX = centerX + distance;
      break;
    case 'up':
      endY = centerY - distance;
      break;
    case 'down':
      endY = centerY + distance;
      break;
  }

  await simulateTouch(page, {
    startX: centerX,
    startY: centerY,
    endX,
    endY,
    steps: 8,
    duration: 250,
  });
}

/**
 * Simulate long press gesture
 */
export async function simulateLongPress(page: Page, element: Locator, duration: number = 800): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found for long press');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.waitForTimeout(duration);
  await page.mouse.up();
}

/**
 * Check if element meets minimum touch target size
 */
export async function verifyTouchTargetSize(
  element: Locator, 
  minSize: number = 44
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) throw new Error('Element not found for touch target verification');

  expect(box.width).toBeGreaterThanOrEqual(minSize);
  expect(box.height).toBeGreaterThanOrEqual(minSize);
}

/**
 * Test mobile navigation patterns
 */
export async function testMobileNavigation(page: Page): Promise<void> {
  const capabilities = await getDeviceCapabilities(page);
  
  if (capabilities.isMobile) {
    // Test hamburger menu
    const hamburger = page.locator('.mobile-nav__hamburger-button');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      
      const menu = page.locator('.mobile-nav__menu');
      await expect(menu).toBeVisible();
      
      // Test navigation
      const navItem = menu.locator('.mobile-nav__menu-button').first();
      await navItem.click();
      
      await expect(menu).not.toBeVisible();
    }
  } else {
    // Test desktop navigation
    const navButton = page.locator('nav button, .sidebar button').first();
    if (await navButton.isVisible()) {
      await navButton.click();
    }
  }
}

/**
 * Test pull-to-refresh functionality
 */
export async function testPullToRefresh(page: Page, container?: Locator): Promise<void> {
  const pullContainer = container || page.locator('.pull-to-refresh, .pull-to-refresh__content').first();
  
  if (await pullContainer.isVisible()) {
    const box = await pullContainer.boundingBox();
    if (!box) return;

    // Simulate pull down gesture
    await simulateTouch(page, {
      startX: box.x + box.width / 2,
      startY: box.y + 20,
      endX: box.x + box.width / 2,
      endY: box.y + 120,
      steps: 10,
      duration: 500,
    });

    // Wait for refresh animation
    await page.waitForTimeout(1000);
  }
}

/**
 * Test responsive layout changes
 */
export async function testResponsiveLayout(page: Page): Promise<void> {
  const originalSize = page.viewportSize();
  if (!originalSize) return;

  // Test mobile layout
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);
  
  const mobileNav = page.locator('.mobile-nav');
  const mobileSidebar = page.locator('.app-shell__sidebar');
  
  if (await mobileNav.isVisible()) {
    await expect(mobileNav).toBeVisible();
  }
  if (await mobileSidebar.isVisible()) {
    await expect(mobileSidebar).not.toBeVisible();
  }

  // Test tablet layout
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);

  // Test desktop layout
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(300);
  
  const desktopSidebar = page.locator('.app-shell__sidebar');
  const desktopMobileNav = page.locator('.mobile-nav');
  
  if (await desktopSidebar.isVisible()) {
    await expect(desktopSidebar).toBeVisible();
  }
  if (await desktopMobileNav.isVisible()) {
    await expect(desktopMobileNav).not.toBeVisible();
  }

  // Restore original size
  await page.setViewportSize(originalSize);
}

/**
 * Measure Core Web Vitals
 */
export async function measureCoreWebVitals(page: Page): Promise<{
  lcp?: number;
  fid?: number;
  cls?: number;
}> {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: any = {};
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
      
      // Return metrics after 2 seconds
      setTimeout(() => resolve(metrics), 2000);
    });
  });
}

/**
 * Test keyboard navigation on mobile
 */
export async function testMobileKeyboardNavigation(page: Page): Promise<void> {
  // Focus first element
  await page.keyboard.press('Tab');
  
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Check focus indicator visibility
  const focusStyles = await focusedElement.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      outline: computed.outline,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
    };
  });
  
  const hasFocusIndicator = 
    (focusStyles.outline && focusStyles.outline !== 'none') ||
    (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
    (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
  
  expect(hasFocusIndicator).toBe(true);
}

/**
 * Test theme switching across devices
 */
export async function testThemeSwitching(page: Page): Promise<void> {
  const themeToggle = page.locator('.theme-switcher button, .dark-mode-toggle__button');
  
  if (await themeToggle.isVisible()) {
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
    
    // Verify theme persists after page reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const persistedTheme = await page.locator('html').getAttribute('data-theme');
    expect(persistedTheme).toBe(newTheme);
  }
}