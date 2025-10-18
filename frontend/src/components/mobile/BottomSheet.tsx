/**
 * Bottom Sheet Component
 * Mobile-native modal pattern with smooth animations and gesture support
 */

import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/utils";
import Button from "../ui/Button";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  snapPoints?: number[]; // Heights in pixels or percentages
  initialSnapPoint?: number;
  allowSwipeDown?: boolean;
  showDragHandle?: boolean;
  closeOnOverlayClick?: boolean;
  maxHeight?: string;
}

const SNAP_THRESHOLD = 50; // Distance to trigger snap

export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      className,
      snapPoints = [60, 90], // Default snap points as percentages
      initialSnapPoint = 0,
      allowSwipeDown = true,
      showDragHandle = true,
      closeOnOverlayClick = true,
      maxHeight = "90vh"
    },
    _ref
  ) => {
    const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const initialTouchY = useRef(0);
    const currentTranslateY = useRef(0);

    // Handle manual dragging for more precise control
    const handleTouchStart = useCallback(
      (e: TouchEvent) => {
        if (!allowSwipeDown) return;

        setIsDragging(true);
        initialTouchY.current = e.touches[0].clientY;
        currentTranslateY.current = dragOffset;
      },
      [allowSwipeDown, dragOffset]
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        if (!isDragging) return;

        const deltaY = e.touches[0].clientY - initialTouchY.current;
        const newOffset = Math.max(0, currentTranslateY.current + deltaY);
        setDragOffset(newOffset);
      },
      [isDragging]
    );

    const handleTouchEnd = useCallback(() => {
      if (!isDragging) return;

      setIsDragging(false);

      // Determine if we should close or snap to a point
      const shouldClose =
        dragOffset > SNAP_THRESHOLD || (dragOffset > 20 && currentSnapPoint === 0);

      if (shouldClose) {
        onClose();
      } else {
        // Snap back to current snap point
        setDragOffset(0);
      }
    }, [isDragging, dragOffset, currentSnapPoint, onClose]);

    // Reset state when sheet opens/closes
    useEffect(() => {
      if (isOpen) {
        setCurrentSnapPoint(initialSnapPoint);
        setDragOffset(0);
        setIsDragging(false);
      }
    }, [isOpen, initialSnapPoint]);

    // Lock body scroll when open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        document.body.style.height = "100vh";
        document.body.style.touchAction = "none";
      } else {
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.body.style.touchAction = "";
      }

      return () => {
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.body.style.touchAction = "";
      };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [isOpen, onClose]);

    // Focus management
    useEffect(() => {
      if (isOpen && sheetRef.current) {
        const firstFocusable = sheetRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentHeight = snapPoints[currentSnapPoint] || snapPoints[0];
    const translateY = isDragging ? dragOffset : 0;

    const bottomSheetContent = (
      <>
        {/* Overlay */}
        <div
          className="bottom-sheet__overlay"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          ref={sheetRef}
          className={cn("bottom-sheet", className)}
          role="dialog"
          aria-modal="true"
          aria-label={title || "Bottom sheet"}
          style={{
            height: `${currentHeight}vh`,
            maxHeight,
            transform: `translateY(${translateY}px)`
          }}
          onTouchStart={(e) => handleTouchStart(e.nativeEvent)}
          onTouchMove={(e) => {
            e.preventDefault();
            handleTouchMove(e.nativeEvent);
          }}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          {showDragHandle && (
            <div className="bottom-sheet__drag-handle" aria-hidden="true">
              <div className="bottom-sheet__drag-indicator" />
            </div>
          )}

          {/* Header */}
          {title && (
            <div className="bottom-sheet__header">
              <h2 className="bottom-sheet__title">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close bottom sheet"
                className="bottom-sheet__close-button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="bottom-sheet__content">{children}</div>
        </div>
      </>
    );

    return createPortal(bottomSheetContent, document.body);
  }
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
