/**
 * Performance Monitoring and Optimization Utilities
 * Core Web Vitals tracking and performance optimization
 */

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  loadTime?: number;
  domContentLoaded?: number;
}

export interface DeviceCapabilities {
  memory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  hardwareConcurrency: number;
  isLowEndDevice: boolean;
}

type MetricListener = (name: string, value: number, metadata?: Record<string, unknown>) => void;

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private deviceCapabilities: DeviceCapabilities;
  private listeners: MetricListener[] = [];

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.initializeMetrics();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === "undefined") {
      return {
        hardwareConcurrency: 4,
        isLowEndDevice: false
      };
    }

    const nav = window.navigator as Navigator & {
      deviceMemory?: number;
      connection?: {
        effectiveType: string;
        downlink: number;
        rtt: number;
      };
      hardwareConcurrency?: number;
    };

    return {
      memory: nav.deviceMemory,
      connection: nav.connection
        ? {
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
            rtt: nav.connection.rtt
          }
        : undefined,
      hardwareConcurrency: nav.hardwareConcurrency ?? 4,
      isLowEndDevice: this.isLowEndDevice(nav)
    };
  }

  private isLowEndDevice(
    nav: Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
      connection?: { effectiveType?: string };
    }
  ): boolean {
    // Heuristics for detecting low-end devices
    const memory = nav.deviceMemory;
    const cores = nav.hardwareConcurrency;
    const connection = nav.connection;

    if (memory && memory <= 2) return true;
    if (cores && cores <= 2) return true;
    if (connection && (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g"))
      return true;

    return false;
  }

  private initializeMetrics(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeNavigation();
    this.observeResources();
  }

  private observeLCP(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric("LCP", lastEntry.startTime);
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("LCP observation failed:", error);
    }
  }

  private observeFID(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const firstInput = entry as PerformanceEventTiming;
          this.metrics.fid = firstInput.processingStart - firstInput.startTime;
          this.reportMetric("FID", this.metrics.fid);
        });
      });

      observer.observe({ entryTypes: ["first-input"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("FID observation failed:", error);
    }
  }

  private observeCLS(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        });

        this.metrics.cls = clsValue;
        this.reportMetric("CLS", clsValue);
      });

      observer.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("CLS observation failed:", error);
    }
  }

  private observeFCP(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            const paintEntry = entry as PerformanceEntry & { startTime: number };
            this.metrics.fcp = paintEntry.startTime;
            this.reportMetric("FCP", paintEntry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ["paint"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("FCP observation failed:", error);
    }
  }

  private observeNavigation(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navigationEntry = entry as PerformanceNavigationTiming;
          this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
          this.metrics.domContentLoaded =
            navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime;
          this.metrics.loadTime = navigationEntry.loadEventEnd - navigationEntry.startTime;

          this.reportMetric("TTFB", this.metrics.ttfb);
          this.reportMetric("DOM_CONTENT_LOADED", this.metrics.domContentLoaded);
          this.reportMetric("LOAD_TIME", this.metrics.loadTime);
        });
      });

      observer.observe({ entryTypes: ["navigation"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("Navigation observation failed:", error);
    }
  }

  private observeResources(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.name.includes(".css") || resourceEntry.name.includes(".js")) {
            const duration = resourceEntry.responseEnd - resourceEntry.startTime;
            this.reportMetric("RESOURCE_LOAD", duration, { resource: resourceEntry.name });
          }
        });
      });

      observer.observe({ entryTypes: ["resource"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("Resource observation failed:", error);
    }
  }

  private reportMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    this.listeners.forEach((listener) => listener(name, value, metadata));

    if (typeof window !== "undefined") {
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;

      if (typeof gtag === "function") {
        gtag("event", "web_vitals", {
          event_category: "Performance",
          event_label: name,
          value: Math.round(value),
          custom_map: metadata
        });
      }
    }

    if (import.meta.env.DEV) {
      console.log(`Performance metric - ${name}:`, value, metadata);
    }
  }

  public reportComponentRender(
    name: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    this.reportMetric(name, value, metadata);
  }

  public addMetricListener(listener: MetricListener): void {
    this.listeners.push(listener);
  }

  public removeMetricListener(listener: MetricListener): void {
    this.listeners = this.listeners.filter((existing) => existing !== listener);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public shouldUseReducedEffects(): boolean {
    return (
      this.deviceCapabilities.isLowEndDevice ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  public shouldPreloadResources(): boolean {
    const connection = this.deviceCapabilities.connection;
    if (!connection) return true;

    // Don't preload on slow connections
    return connection.effectiveType !== "slow-2g" && connection.effectiveType !== "2g";
  }

  public getOptimalImageFormat(): "webp" | "avif" | "jpeg" {
    // Check for modern image format support
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    try {
      if (canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0) {
        return "avif";
      }
    } catch (error) {
      console.warn("AVIF support check failed:", error);
    }

    try {
      if (canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0) {
        return "webp";
      }
    } catch (error) {
      console.warn("WebP support check failed:", error);
    }

    return "jpeg";
  }

  public cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryWarningThreshold = 0.8; // 80% of available memory

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  public monitorMemoryUsage(): void {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
    ).memory;
    if (!memory) {
      return;
    }

    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    if (usage > this.memoryWarningThreshold) {
      this.triggerMemoryCleanup();
    }
  }

  private triggerMemoryCleanup(): void {
    const gCollector = (window as { gc?: () => void }).gc;
    if (typeof gCollector === "function") {
      gCollector();
    }

    window.dispatchEvent(
      new CustomEvent("memory-warning", {
        detail: { timestamp: Date.now() }
      })
    );
  }

  public clearUnusedCaches(): void {
    if (!("caches" in window)) {
      return;
    }

    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        if (cacheName.includes("old-") || cacheName.includes("temp-")) {
          caches.delete(cacheName).catch((error) => {
            console.warn("Failed to delete cache", cacheName, error);
          });
        }
      });
    });
  }
}

// Bundle analysis and code splitting helpers
export function loadComponentAsync<T>(
  loader: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): Promise<T> {
  return loader()
    .then((module) => module.default)
    .catch((error) => {
      console.error("Failed to load component:", error);
      if (fallback) {
        return fallback as unknown as T;
      }
      throw error;
    });
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  performanceMonitor.cleanup();
});

// Export utilities
export { PerformanceMonitor, type PerformanceMetrics, type DeviceCapabilities };

// Memory monitoring
const memoryManager = MemoryManager.getInstance();
if (typeof window !== "undefined") {
  setInterval(() => {
    memoryManager.monitorMemoryUsage();
  }, 30000);
}
