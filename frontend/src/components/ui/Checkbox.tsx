import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../design-system/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => (
    <label className={cn("pm-checkbox", className)}>
      <input ref={ref} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
