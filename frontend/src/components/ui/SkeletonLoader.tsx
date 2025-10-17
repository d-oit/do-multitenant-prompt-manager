/**
 * Skeleton Loader Component
 * Provides loading placeholders with smooth animations
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../design-system/utils";

interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  lines?: number;
}

export const SkeletonLoader = forwardRef<HTMLDivElement, SkeletonLoaderProps>(
  (
    {
      className,
      variant = "rectangular",
      width,
      height,
      animation = "pulse",
      lines = 1,
      style,
      ...props
    },
    ref
  ) => {
    const skeletonStyle = {
      width,
      height,
      ...style,
    };

    // For text variant with multiple lines
    if (variant === "text" && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn("skeleton-loader__container", className)}
          {...props}
        >
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={cn(
                "skeleton-loader",
                `skeleton-loader--${variant}`,
                `skeleton-loader--${animation}`,
                index === lines - 1 && "skeleton-loader--last-line"
              )}
              style={{
                ...skeletonStyle,
                width: index === lines - 1 ? "75%" : width,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "skeleton-loader",
          `skeleton-loader--${variant}`,
          `skeleton-loader--${animation}`,
          className
        )}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);

SkeletonLoader.displayName = "SkeletonLoader";

// Pre-built skeleton components for common use cases
export const SkeletonText = forwardRef<HTMLDivElement, Omit<SkeletonLoaderProps, "variant">>(
  (props, ref) => <SkeletonLoader ref={ref} variant="text" {...props} />
);

export const SkeletonCircle = forwardRef<HTMLDivElement, Omit<SkeletonLoaderProps, "variant">>(
  (props, ref) => <SkeletonLoader ref={ref} variant="circular" {...props} />
);

export const SkeletonRectangle = forwardRef<HTMLDivElement, Omit<SkeletonLoaderProps, "variant">>(
  (props, ref) => <SkeletonLoader ref={ref} variant="rectangular" {...props} />
);

export const SkeletonRounded = forwardRef<HTMLDivElement, Omit<SkeletonLoaderProps, "variant">>(
  (props, ref) => <SkeletonLoader ref={ref} variant="rounded" {...props} />
);

// Complex skeleton layouts
interface SkeletonCardProps {
  showAvatar?: boolean;
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ showAvatar = false, showImage = false, lines = 3, className }, ref) => (
    <div ref={ref} className={cn("skeleton-card", className)}>
      {showImage && (
        <SkeletonRectangle 
          className="skeleton-card__image" 
          height="200px" 
        />
      )}
      <div className="skeleton-card__content">
        {showAvatar && (
          <div className="skeleton-card__header">
            <SkeletonCircle width="40px" height="40px" />
            <div className="skeleton-card__header-text">
              <SkeletonText width="120px" height="16px" />
              <SkeletonText width="80px" height="14px" />
            </div>
          </div>
        )}
        <div className="skeleton-card__body">
          <SkeletonText height="20px" width="60%" />
          <SkeletonText lines={lines} height="16px" />
        </div>
      </div>
    </div>
  )
);

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const SkeletonTable = forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 5, columns = 4, showHeader = true, className }, ref) => (
    <div ref={ref} className={cn("skeleton-table", className)}>
      {showHeader && (
        <div className="skeleton-table__header">
          {Array.from({ length: columns }, (_, index) => (
            <SkeletonText 
              key={`header-${index}`} 
              height="16px" 
              width="80px" 
            />
          ))}
        </div>
      )}
      <div className="skeleton-table__body">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="skeleton-table__row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <SkeletonText 
                key={`cell-${rowIndex}-${colIndex}`} 
                height="14px" 
                width={colIndex === 0 ? "120px" : "80px"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
);

SkeletonText.displayName = "SkeletonText";
SkeletonCircle.displayName = "SkeletonCircle";
SkeletonRectangle.displayName = "SkeletonRectangle";
SkeletonRounded.displayName = "SkeletonRounded";
SkeletonCard.displayName = "SkeletonCard";
SkeletonTable.displayName = "SkeletonTable";

export default SkeletonLoader;