/**
 * Floating Action Button Component
 * Mobile-optimized primary action button with haptic-like feedback
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../design-system/utils";

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  size?: "md" | "lg";
  loading?: boolean;
}

const LoadingSpinner = ({ size }: { size: "md" | "lg" }) => {
  const spinnerSize = size === "lg" ? "24" : "20";

  return (
    <svg
      className="fab__spinner"
      width={spinnerSize}
      height={spinnerSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round" />
    </svg>
  );
};

export const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  (
    {
      className,
      icon,
      position = "bottom-right",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "fab",
          `fab--${position}`,
          `fab--${size}`,
          loading && "fab--loading",
          className
        )}
        {...props}
      >
        <div className="fab__content">
          {loading ? (
            <LoadingSpinner size={size} />
          ) : icon ? (
            <span className="fab__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {children && !loading && (
            <span className="fab__label">{children}</span>
          )}
        </div>
        <div className="fab__ripple" aria-hidden="true" />
      </button>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";

export default FloatingActionButton;