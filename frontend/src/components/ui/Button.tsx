import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "pm-button--primary",
  secondary: "pm-button--secondary",
  ghost: "pm-button--ghost",
  danger: "pm-button--danger"
};

const sizeClassMap: Record<ButtonSize, string> = {
  xs: "pm-button--xs",
  sm: "pm-button--sm",
  md: "",
  lg: "pm-button--lg"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth = false, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "pm-button",
          variantClassMap[variant],
          sizeClassMap[size],
          fullWidth && "pm-button--full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
