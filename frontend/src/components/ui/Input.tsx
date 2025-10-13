import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <input ref={ref} className={cn("pm-input", invalid && "pm-input--invalid", className)} {...props} />
  )
);

Input.displayName = "Input";

export default Input;
