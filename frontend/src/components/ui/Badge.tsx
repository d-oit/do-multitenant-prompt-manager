import type { HTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

type BadgeTone = "info" | "success" | "warning" | "archived" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClassMap: Record<BadgeTone, string> = {
  info: "",
  success: "pm-badge--success",
  warning: "pm-badge--warning",
  archived: "pm-badge--archived",
  danger: "pm-badge--danger"
};

export function Badge({ className, tone = "info", ...props }: BadgeProps): JSX.Element {
  return <span className={cn("pm-badge", toneClassMap[tone], className)} {...props} />;
}

export default Badge;
