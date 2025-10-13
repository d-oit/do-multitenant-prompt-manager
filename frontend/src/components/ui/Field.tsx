import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../design-system/utils";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
  ...props
}: FieldProps): JSX.Element {
  return (
    <div className={cn("pm-field", className)} {...props}>
      <label className="pm-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {description ? <p className="pm-field__description pm-muted">{description}</p> : null}
      {error ? <p className="pm-field__error">{error}</p> : null}
    </div>
  );
}

export default Field;
