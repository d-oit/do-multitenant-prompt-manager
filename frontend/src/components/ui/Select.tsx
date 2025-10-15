import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("pm-select", invalid && "pm-select--invalid", className)}
      {...props}
    />
  )
);

Select.displayName = "Select";

export default Select;
