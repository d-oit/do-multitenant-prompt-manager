import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <textarea ref={ref} className={cn("pm-textarea", invalid && "pm-textarea--invalid", className)} {...props} />
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
