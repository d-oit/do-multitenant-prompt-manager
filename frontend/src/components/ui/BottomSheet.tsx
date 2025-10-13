/**
 * Bottom Sheet Component (Mobile)
 * Slide-up sheet optimized for mobile interactions
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[]; // Snap points as percentages of viewport height
  defaultSnap?: number; // Index of default snap point
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [90, 50],
  defaultSnap = 1,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const currentSnapIndex = useRef<number>(defaultSnap);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sheetRef.current) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow dragging down
    if (deltaY > 0) {
      const translateY = Math.min(deltaY, window.innerHeight);
      sheetRef.current.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!sheetRef.current) return;

    const deltaY = currentY.current - startY.current;
    const velocity = deltaY / (window.innerHeight * 0.1);

    // Close if dragged down more than 30% or with high velocity
    if (deltaY > window.innerHeight * 0.3 || velocity > 0.5) {
      onClose();
    } else {
      // Snap to closest snap point
      const targetHeight = findClosestSnapPoint(deltaY);
      sheetRef.current.style.transform = `translateY(${100 - targetHeight}%)`;
    }

    // Reset
    sheetRef.current.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
      }
    }, 300);
  };

  const findClosestSnapPoint = (dragDelta: number): number => {
    const currentHeight =
      ((window.innerHeight - dragDelta) / window.innerHeight) * 100;
    
    let closest = snapPoints[0];
    let minDiff = Math.abs(currentHeight - closest);

    for (const snap of snapPoints) {
      const diff = Math.abs(currentHeight - snap);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snap;
      }
    }

    return closest;
  };

  if (!isOpen) return null;

  const initialHeight = snapPoints[currentSnapIndex.current];

  return createPortal(
    <>
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        style={{
          height: `${initialHeight}vh`,
          transform: `translateY(${100 - initialHeight}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet__handle" aria-hidden="true">
          <div className="bottom-sheet__handle-bar" />
        </div>

        {title && (
          <div className="bottom-sheet__header">
            <h2 id="sheet-title" className="bottom-sheet__title">
              {title}
            </h2>
          </div>
        )}

        <div className="bottom-sheet__content">{children}</div>
      </div>
    </>,
    document.body
  );
}

// Bottom sheet menu - common pattern for mobile actions
export interface BottomSheetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>;
}

export function BottomSheetMenu({
  isOpen,
  onClose,
  title,
  items,
}: BottomSheetMenuProps) {
  const handleItemClick = (item: BottomSheetMenuProps['items'][0]) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} snapPoints={[60]}>
      <div className="bottom-sheet-menu">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            className={`bottom-sheet-menu__item ${
              item.variant === 'danger' ? 'bottom-sheet-menu__item--danger' : ''
            }`}
            disabled={item.disabled}
            type="button"
          >
            {item.icon && (
              <span className="bottom-sheet-menu__icon">{item.icon}</span>
            )}
            <span className="bottom-sheet-menu__label">{item.label}</span>
          </button>
        ))}

        <button
          onClick={onClose}
          className="bottom-sheet-menu__item bottom-sheet-menu__item--cancel"
          type="button"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
