/**
 * Performance Monitoring Hooks
 * React hooks for performance tracking and optimization
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { performanceMonitor } from "../utils/performance";
import type { DeviceCapabilities, PerformanceMetrics } from "../utils/performance";

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    if (import.meta.env.DEV && renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Track in performance monitoring
    if (renderTime > 50) {
      // Only track unusually slow renders
      performanceMonitor.reportComponentRender?.("COMPONENT_RENDER", renderTime, {
        component: componentName,
        renderCount: renderCount.current
      });
    }
  });

  return {
    renderCount: renderCount.current
  };
}

// Hook for image optimization based on device capabilities
export function useOptimizedImages() {
  const [imageFormat, setImageFormat] = useState<"webp" | "avif" | "jpeg">("jpeg");
  const [shouldPreload, setShouldPreload] = useState(true);

  useEffect(() => {
    const format = performanceMonitor.getOptimalImageFormat();
    const preload = performanceMonitor.shouldPreloadResources();

    setImageFormat(format);
    setShouldPreload(preload);
  }, []);

  const getOptimizedImageSrc = useCallback(
    (
      basePath: string,
      options: {
        width?: number;
        height?: number;
        quality?: number;
      } = {}
    ) => {
      const { width, height, quality = 80 } = options;
      const extension = imageFormat === "jpeg" ? "jpg" : imageFormat;

      let optimizedPath = basePath.replace(/\.[^.]+$/, `.${extension}`);

      const params = new URLSearchParams();
      if (width) params.append("w", width.toString());
      if (height) params.append("h", height.toString());
      if (quality !== 80) params.append("q", quality.toString());

      if (params.toString()) {
        optimizedPath += `?${params.toString()}`;
      }

      return optimizedPath;
    },
    [imageFormat]
  );

  return {
    imageFormat,
    shouldPreload,
    getOptimizedImageSrc
  };
}

// Hook for adaptive performance based on device capabilities
export function useAdaptivePerformance() {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [shouldReduceEffects, setShouldReduceEffects] = useState(false);

  useEffect(() => {
    const capabilities = performanceMonitor.getDeviceCapabilities();
    const reduceEffects = performanceMonitor.shouldUseReducedEffects();

    setDeviceCapabilities(capabilities);
    setShouldReduceEffects(reduceEffects);
  }, []);

  const getAnimationConfig = useCallback(() => {
    if (shouldReduceEffects) {
      return {
        duration: 0,
        easing: "linear",
        reduce: true
      };
    }

    if (deviceCapabilities?.isLowEndDevice) {
      return {
        duration: 200, // Shorter animations
        easing: "ease-out",
        reduce: false
      };
    }

    return {
      duration: 300,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      reduce: false
    };
  }, [shouldReduceEffects, deviceCapabilities]);

  const shouldUseVirtualization = useCallback(
    (itemCount: number) => {
      if (deviceCapabilities?.isLowEndDevice) {
        return itemCount > 50; // Lower threshold for low-end devices
      }
      return itemCount > 100;
    },
    [deviceCapabilities]
  );

  const getOptimalChunkSize = useCallback(() => {
    if (deviceCapabilities?.isLowEndDevice) {
      return 10; // Smaller chunks for low-end devices
    }
    return 25;
  }, [deviceCapabilities]);

  return {
    deviceCapabilities,
    shouldReduceEffects,
    getAnimationConfig,
    shouldUseVirtualization,
    getOptimalChunkSize
  };
}

// Hook for Core Web Vitals monitoring
export function useWebVitals() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 1000);

    // Initial update
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  const getVitalsScore = useCallback(() => {
    const { lcp, fid, cls } = metrics;

    const scores = {
      lcp: lcp ? (lcp <= 2500 ? "good" : lcp <= 4000 ? "needs-improvement" : "poor") : "unknown",
      fid: fid ? (fid <= 100 ? "good" : fid <= 300 ? "needs-improvement" : "poor") : "unknown",
      cls: cls ? (cls <= 0.1 ? "good" : cls <= 0.25 ? "needs-improvement" : "poor") : "unknown"
    };

    const goodCount = Object.values(scores).filter((score) => score === "good").length;

    return {
      scores,
      overall: goodCount === 3 ? "good" : goodCount >= 2 ? "needs-improvement" : "poor"
    };
  }, [metrics]);

  return {
    metrics,
    getVitalsScore
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ("memory" in performance) {
        const memory = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
          }
        ).memory;
        if (!memory) return;
        const used = memory.usedJSHeapSize;
        const total = memory.jsHeapSizeLimit;
        const percentage = (used / total) * 100;

        setMemoryUsage({ used, total, percentage });
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage();

    // Listen for memory warnings
    const handleMemoryWarning = () => {
      console.warn("Memory usage is high, consider optimizing");
    };

    window.addEventListener("memory-warning", handleMemoryWarning);

    return () => {
      clearInterval(interval);
      window.removeEventListener("memory-warning", handleMemoryWarning);
    };
  }, []);

  return memoryUsage;
}

// Hook for intersection observer with performance optimization
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "50px", // Preload slightly before entering viewport
      threshold: 0.1,
      ...options
    });

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return targetRef;
}
