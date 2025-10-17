/**
 * Performance Monitoring and Optimization Utilities
 * Core Web Vitals tracking and performance optimization
 */

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  loadTime?: number;
  domContentLoaded?: number;
}

interface DeviceCapabilities {
  memory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  hardwareConcurrency: number;
  isLowEndDevice: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private deviceCapabilities: DeviceCapabilities;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.initializeMetrics();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const nav = navigator as any;
    
    return {
      memory: nav.deviceMemory,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
      } : undefined,
      hardwareConcurrency: nav.hardwareConcurrency || 4,
      isLowEndDevice: this.isLowEndDevice(nav),
    };
  }

  private isLowEndDevice(nav: any): boolean {
    // Heuristics for detecting low-end devices
    const memory = nav.deviceMemory;
    const cores = nav.hardwareConcurrency;
    const connection = nav.connection;

    if (memory && memory <= 2) return true;
    if (cores && cores <= 2) return true;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) return true;
    
    return false;
  }

  private initializeMetrics(): void {
    // Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    
    // Navigation timing
    this.observeNavigation();
    
    // Resource timing for critical resources
    this.observeResources();
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation failed:', error);
    }
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation failed:', error);
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.cls = clsValue;
        this.reportMetric('CLS', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation failed:', error);
    }
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observation failed:', error);
    }
  }

  private observeNavigation(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.ttfb = entry.responseStart - entry.requestStart;
          this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
          this.metrics.loadTime = entry.loadEventEnd - entry.navigationStart;
          
          this.reportMetric('TTFB', this.metrics.ttfb);
          this.reportMetric('DOM_CONTENT_LOADED', this.metrics.domContentLoaded);
          this.reportMetric('LOAD_TIME', this.metrics.loadTime);
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation observation failed:', error);
    }
  }

  private observeResources(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // Track critical resources
          if (entry.name.includes('.css') || entry.name.includes('.js')) {
            const duration = entry.responseEnd - entry.startTime;
            this.reportMetric('RESOURCE_LOAD', duration, { resource: entry.name });
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource observation failed:', error);
    }
  }

  private reportMetric(name: string, value: number, metadata?: any): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_map: metadata,
      });
    }
    
    // Log for development
    if (import.meta.env.DEV) {
      console.log(`Performance metric - ${name}:`, value, metadata);
    }
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
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  public shouldPreloadResources(): boolean {
    const connection = this.deviceCapabilities.connection;
    if (!connection) return true;
    
    // Don't preload on slow connections
    return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
  }

  public getOptimalImageFormat(): 'webp' | 'avif' | 'jpeg' {
    // Check for modern image format support
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Check AVIF support
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif';
    }
    
    // Check WebP support
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    
    return 'jpeg';
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
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
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usage > this.memoryWarningThreshold) {
        this.triggerMemoryCleanup();
      }
    }
  }

  private triggerMemoryCleanup(): void {
    // Trigger garbage collection hint
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Emit memory warning event
    window.dispatchEvent(new CustomEvent('memory-warning', {
      detail: { timestamp: Date.now() }
    }));
  }

  public clearUnusedCaches(): void {
    // Clear unused image caches, component caches, etc.
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('old-') || cacheName.includes('temp-')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }
}

// Bundle analysis and code splitting helpers
export function loadComponentAsync<T>(
  loader: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): Promise<T> {
  return loader()
    .then(module => module.default)
    .catch(error => {
      console.error('Failed to load component:', error);
      if (fallback) {
        return fallback as unknown as T;
      }
      throw error;
    });
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup();
});

// Export utilities
export { PerformanceMonitor, type PerformanceMetrics, type DeviceCapabilities };

// Memory monitoring
const memoryManager = MemoryManager.getInstance();
setInterval(() => {
  memoryManager.monitorMemoryUsage();
}, 30000); // Check every 30 seconds