/**
 * Service Worker registration and management
 */

/* eslint-disable no-console */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  // Wait for page to load
  if (document.readyState === "loading") {
    await new Promise((resolve) => {
      window.addEventListener("load", resolve);
    });
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });

    // eslint-disable-next-line no-console
    console.log("[SW] Registration successful:", registration.scope);

    // Check for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("[SW] New version available");
          config.onUpdate?.(registration);
        }
      });
    });

    // Check for successful registration
    if (registration.active) {
      config.onSuccess?.(registration);
    }
  } catch (error) {
    console.error("[SW] Registration failed:", error);
    config.onError?.(error as Error);
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log("[SW] Unregistration successful:", success);
    return success;
  } catch (error) {
    console.error("[SW] Unregistration failed:", error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("[SW] All caches cleared");
  } catch (error) {
    console.error("[SW] Failed to clear caches:", error);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  applicationServerKey: BufferSource
): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log("[SW] Push subscription successful");
    return subscription;
  } catch (error) {
    console.error("[SW] Push subscription failed:", error);
    return null;
  }
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerActive(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    !!navigator.serviceWorker.controller
  );
}

/**
 * Send message to service worker
 */
export async function sendMessageToServiceWorker(message: unknown): Promise<void> {
  if (!isServiceWorkerActive()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage(message);
}

/**
 * Force service worker update
 */
export async function updateServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log("[SW] Manual update check completed");
  } catch (error) {
    console.error("[SW] Manual update failed:", error);
  }
}
