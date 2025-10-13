import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../design-system/utils";

type CardVariant = "default" | "accent";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CardVariant;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

const variantClassMap: Record<CardVariant, string> = {
  default: "",
  accent: "pm-card--accent"
};

export function Card({
  variant = "default",
  title,
  subtitle,
  actions,
  className,
  children,
  ...props
}: CardProps): JSX.Element {
  const showHeader = title || subtitle || actions;

  return (
    <section className={cn("pm-card", variantClassMap[variant], className)} {...props}>
      {showHeader ? (
        <header className="pm-card__header">
          <div className="pm-card__heading">
            {title ? <h2 className="pm-card__title">{title}</h2> : null}
            {subtitle ? <p className="pm-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="pm-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="pm-card__content">{children}</div>
    </section>
  );
}

export default Card;
