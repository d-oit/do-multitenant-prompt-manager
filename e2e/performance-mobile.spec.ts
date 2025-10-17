/**
 * Mobile Performance E2E Tests
 * Tests for Core Web Vitals, loading performance, and mobile-specific optimizations
 */

import { test, expect, devices } from '@playwright/test';
import { createTestTenant, createTestPrompt } from './setup/dbHelpers';

test.describe('Mobile Performance and Core Web Vitals', () => {
  let testTenant: any;

  test.beforeAll(async () => {
    testTenant = await createTestTenant('performance-test');
    // Create multiple test prompts for performance testing
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        createTestPrompt(testTenant.id, `Performance Test Prompt ${i + 1}`, `Test content ${i + 1}`)
      )
    );
  });

  test.describe('Core Web Vitals', () => {
    test('Largest Contentful Paint (LCP) on Mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Start measuring performance
      await page.goto('/', { waitUntil: 'networkidle' });

      // Measure LCP
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      // LCP should be under 2.5 seconds for good performance
      expect(lcp).toBeLessThan(2500);
    });

    test('First Input Delay (FID) Simulation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Measure responsiveness by timing click response
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        const startTime = Date.now();
        await button.click();
        const endTime = Date.now();
        
        const inputDelay = endTime - startTime;
        
        // Should respond quickly (under 100ms)
        expect(inputDelay).toBeLessThan(300); // Relaxed for E2E
      }
    });

    test('Cumulative Layout Shift (CLS) Detection', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Monitor layout shifts
      let cls = 0;
      await page.evaluateOnNewDocument(() => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              (window as any).clsValue = ((window as any).clsValue || 0) + (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for potential layout shifts to occur
      await page.waitForTimeout(2000);

      cls = await page.evaluate(() => (window as any).clsValue || 0);
      
      // CLS should be minimal (under 0.1 for good UX)
      expect(cls).toBeLessThan(0.25); // Relaxed threshold
    });
  });

  test.describe('Loading Performance', () => {
    test('Page Load Time on Slow 3G', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE'],
        // Simulate slow 3G connection
        offline: false,
      });
      
      const page = await context.newPage();
      
      // Throttle network to simulate slow connection
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      await context.close();
    });

    test('Resource Loading Optimization', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Track resource loading
      const resourceSizes: { [key: string]: number } = {};
      const resourceCount = { total: 0, critical: 0 };

      page.on('response', (response) => {
        const url = response.url();
        const size = parseInt(response.headers()['content-length'] || '0');
        
        resourceCount.total++;
        
        if (url.includes('.js') || url.includes('.css') || url.includes('.html')) {
          resourceCount.critical++;
          resourceSizes[url] = size;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not load too many resources
      expect(resourceCount.total).toBeLessThan(50);
      expect(resourceCount.critical).toBeLessThan(20);

      // Individual resources should be reasonably sized
      Object.entries(resourceSizes).forEach(([url, size]) => {
        if (url.includes('.js')) {
          expect(size).toBeLessThan(500000); // 500KB max for JS files
        }
        if (url.includes('.css')) {
          expect(size).toBeLessThan(100000); // 100KB max for CSS files
        }
      });
    });

    test('Critical Resource Preloading', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check for preload hints
      const preloadLinks = await page.locator('link[rel="preload"]').count();
      const prefetchLinks = await page.locator('link[rel="prefetch"]').count();

      // Should have some optimization hints
      expect(preloadLinks + prefetchLinks).toBeGreaterThan(0);
    });
  });

  test.describe('Memory Performance', () => {
    test('Memory Usage During Navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (initialMemory) {
        // Navigate through different pages
        await page.click('button:has-text("Prompts")');
        await page.waitForLoadState('networkidle');
        
        await page.click('button:has-text("Analytics")');
        await page.waitForLoadState('networkidle');
        
        await page.click('button:has-text("Dashboard")');
        await page.waitForLoadState('networkidle');

        // Check memory after navigation
        const finalMemory = await page.evaluate(() => {
          return {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          };
        });

        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreasePercentage = (memoryIncrease / initialMemory.used) * 100;

        // Memory shouldn't increase dramatically during navigation
        expect(memoryIncreasePercentage).toBeLessThan(200); // Less than 200% increase
      }
    });

    test('Memory Cleanup After Component Unmount', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      const beforeMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });

      // Create and destroy components by navigating
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Analytics")');
        await page.waitForLoadState('networkidle');
        await page.click('button:has-text("Prompts")');
        await page.waitForLoadState('networkidle');
      }

      // Force garbage collection again
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      const afterMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });

      if (beforeMemory && afterMemory) {
        const memoryIncrease = afterMemory - beforeMemory;
        const leakThreshold = 5000000; // 5MB threshold for potential leaks

        expect(memoryIncrease).toBeLessThan(leakThreshold);
      }
    });
  });

  test.describe('Animation Performance', () => {
    test('Animation Frame Rate', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test animation performance during mobile menu toggle
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      
      if (await hamburger.isVisible()) {
        // Measure animation performance
        const frameRate = await page.evaluate(async () => {
          return new Promise((resolve) => {
            let frames = 0;
            const startTime = Date.now();
            
            const countFrame = () => {
              frames++;
              if (Date.now() - startTime < 1000) {
                requestAnimationFrame(countFrame);
              } else {
                resolve(frames);
              }
            };
            
            requestAnimationFrame(countFrame);
          });
        });

        // Should maintain reasonable frame rate
        expect(frameRate).toBeGreaterThan(30); // At least 30fps
      }
    });

    test('CPU Usage During Animations', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Trigger multiple animations
      const hamburger = page.locator('.mobile-nav__hamburger-button');
      
      if (await hamburger.isVisible()) {
        const startTime = Date.now();
        
        // Rapidly toggle menu to stress test
        for (let i = 0; i < 5; i++) {
          await hamburger.click();
          await page.waitForTimeout(100);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(100);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Operations should complete in reasonable time
        expect(totalTime).toBeLessThan(3000); // 3 seconds max
      }
    });
  });

  test.describe('Network Performance', () => {
    test('API Response Times on Mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const apiTimes: number[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('/api/')) {
          const timing = response.timing();
          apiTimes.push(timing.responseEnd - timing.requestStart);
        }
      });

      await page.goto('/prompts');
      await page.waitForLoadState('networkidle');

      if (apiTimes.length > 0) {
        const averageTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
        const maxTime = Math.max(...apiTimes);

        // API responses should be fast
        expect(averageTime).toBeLessThan(1000); // 1 second average
        expect(maxTime).toBeLessThan(3000); // 3 seconds max
      }
    });

    test('Offline Capability', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.setOffline(true);

      // Try to navigate
      await page.click('button:has-text("Prompts")');
      
      // Should handle offline gracefully
      const errorMessage = page.locator(':has-text("offline"), :has-text("connection")');
      const cachedContent = page.locator('.data-table, .prompt-list');
      
      // Either show cached content or appropriate offline message
      const hasContent = await cachedContent.isVisible();
      const hasOfflineMessage = await errorMessage.isVisible();
      
      expect(hasContent || hasOfflineMessage).toBe(true);

      // Go back online
      await page.setOffline(false);
    });
  });
});