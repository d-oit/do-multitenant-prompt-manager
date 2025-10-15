/**
 * Error tracking and reporting utilities
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

export interface ErrorReport {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  url: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  endpoint?: string;
  sampleRate?: number; // 0-1, percentage of errors to report
  ignoreErrors?: RegExp[];
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
}

class ErrorTracker {
  private config: ErrorTrackingConfig;
  private errors: ErrorReport[] = [];
  private maxStoredErrors = 100;

  constructor(config: ErrorTrackingConfig) {
    this.config = config;

    if (config.enabled && typeof window !== "undefined") {
      this.setupGlobalHandlers();
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, {
        type: "unhandledRejection",
        promise: event.promise
      });
    });

    // Handle global errors
    window.addEventListener("error", (event) => {
      this.captureError(event.error || event.message, {
        type: "globalError",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle React error boundary errors
    window.addEventListener("react-error", ((
      event: CustomEvent<{ error: Error; componentStack?: string }>
    ) => {
      this.captureError(event.detail.error, {
        type: "reactError",
        componentStack: event.detail.componentStack
      });
    }) as EventListener);
  }

  /**
   * Capture an error
   */
  captureError(
    error: Error | string,
    context?: Record<string, unknown>,
    severity: ErrorReport["severity"] = "medium"
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // Sample rate check
    if (this.config.sampleRate && Math.random() > this.config.sampleRate) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if error should be ignored
    if (this.config.ignoreErrors?.some((pattern) => pattern.test(errorMessage))) {
      return;
    }

    const report: ErrorReport = {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity
    };

    // Allow modification or filtering via beforeSend
    const finalReport = this.config.beforeSend ? this.config.beforeSend(report) : report;

    if (!finalReport) {
      return;
    }

    // Store locally
    this.storeError(finalReport);

    // Send to endpoint
    if (this.config.endpoint) {
      void this.sendError(finalReport);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorTracker]", finalReport);
    }
  }

  /**
   * Store error locally
   */
  private storeError(report: ErrorReport): void {
    this.errors.push(report);

    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // Store in localStorage
    try {
      localStorage.setItem("error-reports", JSON.stringify(this.errors.slice(-10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Send error to endpoint
   */
  private async sendError(report: ErrorReport): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(report),
        // Use keepalive to ensure request completes even if page unloads
        keepalive: true
      });
    } catch (error) {
      // Silently fail - don't want error tracking to cause more errors
      console.warn("[ErrorTracker] Failed to send error report:", error);
    }
  }

  /**
   * Get stored errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
    try {
      localStorage.removeItem("error-reports");
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(message: string, data?: Record<string, unknown>): void {
    // This could be enhanced to store breadcrumbs
    if (import.meta.env.DEV) {
      console.log("[Breadcrumb]", message, data);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; [key: string]: unknown }): void {
    // Store user context for error reports
    if (typeof window !== "undefined") {
      (window as any).__errorTrackerUser = user;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let errorTracker: ErrorTracker | null = null;

/**
 * Initialize error tracking
 */
export function initErrorTracking(config: ErrorTrackingConfig): ErrorTracker {
  if (errorTracker) {
    errorTracker.updateConfig(config);
    return errorTracker;
  }

  errorTracker = new ErrorTracker(config);
  return errorTracker;
}

/**
 * Get error tracker instance
 */
export function getErrorTracker(): ErrorTracker | null {
  return errorTracker;
}

/**
 * Capture an error
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
  severity?: ErrorReport["severity"]
): void {
  errorTracker?.captureError(error, context, severity);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  errorTracker?.addBreadcrumb(message, data);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; [key: string]: unknown }): void {
  errorTracker?.setUser(user);
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End timing and report
   */
  end(label: string): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) {
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (import.meta.env.DEV) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure and report
   */
  async measure<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Get web vitals
   */
  getWebVitals(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log("[WebVitals] LCP:", lastEntry.startTime);
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        console.log("[WebVitals] FID:", fid);
      });
    }).observe({ entryTypes: ["first-input"] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let cls = 0;
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      console.log("[WebVitals] CLS:", cls);
    }).observe({ entryTypes: ["layout-shift"] });
  }
}

export const performanceMonitor = new PerformanceMonitor();
