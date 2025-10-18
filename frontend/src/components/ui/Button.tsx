/**
 * Modern Button Component (2025 Best Practices)
 * Accessible, responsive, with loading and icon support
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../design-system/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "pm-button--primary",
  secondary: "pm-button--secondary",
  ghost: "pm-button--ghost",
  danger: "pm-button--danger",
  success: "pm-button--success",
  outline: "pm-button--outline"
};

const sizeClassMap: Record<ButtonSize, string> = {
  xs: "pm-button--xs",
  sm: "pm-button--sm",
  md: "",
  lg: "pm-button--lg",
  xl: "pm-button--xl"
};

const LoadingSpinner = ({ size }: { size: ButtonSize }) => {
  const spinnerSize =
    size === "xs" || size === "sm" ? "14" : size === "lg" || size === "xl" ? "20" : "16";

  return (
    <svg
      className="pm-button__spinner"
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      type = "button",
      disabled,
      children,
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
          "pm-button",
          variantClassMap[variant],
          sizeClassMap[size],
          fullWidth && "pm-button--full",
          loading && "pm-button--loading",
          className
        )}
        style={{
          minHeight: size === "xs" ? "32px" : size === "sm" ? "36px" : "44px", // Touch-friendly minimum
          ...props.style
        }}
        {...props}
      >
        {loading && <LoadingSpinner size={size} />}
        {!loading && leftIcon && (
          <span className="pm-button__icon pm-button__icon--left">{leftIcon}</span>
        )}
        {children && <span className="pm-button__content">{children}</span>}
        {!loading && rightIcon && (
          <span className="pm-button__icon pm-button__icon--right">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
