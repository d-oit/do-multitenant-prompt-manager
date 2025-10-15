/**
 * Modal/Dialog Component
 * Accessible modal dialog with backdrop and focus management
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Focus modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";

        // Restore focus
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "modal--sm",
    md: "modal--md",
    lg: "modal--lg",
    xl: "modal--xl"
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick} aria-hidden="true" />
      <div
        className={`modal ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="modal__content">
          {(title || showCloseButton) && (
            <div className="modal__header">
              {title && (
                <h2 id="modal-title" className="modal__title">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="modal__close"
                  aria-label="Close dialog"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          )}
          <div className="modal__body">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}

// Confirmation dialog helper
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  requireConfirmText?: string; // If provided, user must type this to confirm
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  requireConfirmText
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const canConfirm = requireConfirmText ? inputValue === requireConfirmText : true;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onClose();
    }
  };

  const variantClass = variant === "danger" ? "btn-danger" : "btn-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="stack-md">
        <p>{message}</p>

        {requireConfirmText && (
          <div className="pm-field">
            <label className="pm-field__label">Type {requireConfirmText} to confirm:</label>
            <input
              type="text"
              className="pm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireConfirmText}
            />
          </div>
        )}

        <div className="flex gap-md justify-end">
          <button onClick={onClose} className="btn btn-secondary" type="button">
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`btn ${variantClass}`}
            disabled={!canConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
