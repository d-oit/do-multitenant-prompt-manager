import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../design-system/utils";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  leadingIcon?: ReactNode;
}

export function Tag({ leadingIcon, className, children, ...props }: TagProps): JSX.Element {
  return (
    <span className={cn("pm-tag", className)} {...props}>
      {leadingIcon}
      {children}
    </span>
  );
}

export default Tag;
