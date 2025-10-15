/**
 * Toast Notification Component
 * Displays temporary notifications with different variants
 */

import { useCallback, useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200); // Match animation duration
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, handleDismiss]);

  const variantStyles = {
    success: "alert-success",
    error: "alert-error",
    warning: "alert-warning",
    info: "alert-info"
  };

  const icons = {
    success: "✓",
    error: "⚠",
    warning: "⚠",
    info: "ℹ"
  };

  return (
    <div
      className={`toast ${variantStyles[toast.variant]} ${isExiting ? "toast-exit" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__icon">{icons[toast.variant]}</div>
      <div className="toast__content">
        <p className="toast__message">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className="toast__action"
            type="button"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="toast__close"
        aria-label="Dismiss notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Toast manager hook
let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let toasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setLocalToasts);
    return () => {
      listeners.delete(setLocalToasts);
    };
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      options?: { duration?: number; action?: Toast["action"] }
    ) => {
      const id = `toast-${++toastId}`;
      const newToast: Toast = {
        id,
        message,
        variant,
        duration: options?.duration,
        action: options?.action
      };

      toasts = [...toasts, newToast];
      notifyListeners();

      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  const success = useCallback(
    (message: string, options?: { duration?: number; action?: Toast["action"] }) =>
      showToast(message, "success", options),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: { duration?: number; action?: Toast["action"] }) =>
      showToast(message, "error", options),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: { duration?: number; action?: Toast["action"] }) =>
      showToast(message, "warning", options),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: { duration?: number; action?: Toast["action"] }) =>
      showToast(message, "info", options),
    [showToast]
  );

  return {
    toasts: localToasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info
  };
}
