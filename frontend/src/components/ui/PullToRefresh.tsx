/**
 * Pull to Refresh Component
 * Wraps content with native-like pull-to-refresh functionality
 */

import { forwardRef, type ReactNode } from "react";
import { cn } from "../../design-system/utils";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  threshold?: number;
  maxDistance?: number;
  enabled?: boolean;
  refreshIndicator?: ReactNode;
}

const DefaultRefreshIndicator = ({ isRefreshing, canRefresh }: { isRefreshing: boolean; canRefresh: boolean }) => (
  <div className={cn(
    "pull-to-refresh__indicator",
    isRefreshing && "pull-to-refresh__indicator--refreshing",
    canRefresh && "pull-to-refresh__indicator--can-refresh"
  )}>
    <svg 
      className="pull-to-refresh__icon" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      {isRefreshing ? (
        <>
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round" className="pull-to-refresh__spinner" />
        </>
      ) : (
        <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      )}
    </svg>
    <span className="pull-to-refresh__text">
      {isRefreshing ? "Refreshing..." : canRefresh ? "Release to refresh" : "Pull to refresh"}
    </span>
  </div>
);

export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  (
    {
      onRefresh,
      children,
      className,
      threshold = 80,
      maxDistance = 120,
      enabled = true,
      refreshIndicator,
    },
    ref
  ) => {
    const {
      containerRef,
      isRefreshing,
      canRefresh,
      getRefreshIndicatorStyle,
      getContainerStyle,
    } = usePullToRefresh({
      onRefresh,
      threshold,
      maxDistance,
      enabled,
    });

    return (
      <div
        ref={ref}
        className={cn("pull-to-refresh", className)}
      >
        {/* Refresh Indicator */}
        <div
          className="pull-to-refresh__indicator-container"
          style={getRefreshIndicatorStyle()}
        >
          {refreshIndicator || (
            <DefaultRefreshIndicator 
              isRefreshing={isRefreshing} 
              canRefresh={canRefresh} 
            />
          )}
        </div>

        {/* Content Container */}
        <div
          ref={containerRef as any}
          className="pull-to-refresh__content"
          style={getContainerStyle()}
        >
          {children}
        </div>
      </div>
    );
  }
);

PullToRefresh.displayName = "PullToRefresh";

export default PullToRefresh;