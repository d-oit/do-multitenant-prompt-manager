/**
 * Pull to Refresh Hook
 * Native-like pull-to-refresh functionality for mobile devices
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxDistance?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_MAX_DISTANCE = 120;
const DEFAULT_RESISTANCE = 0.5;

export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = DEFAULT_THRESHOLD,
    maxDistance = DEFAULT_MAX_DISTANCE,
    resistance = DEFAULT_RESISTANCE,
    enabled = true
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLElement>(null);

  const updatePullDistance = useCallback(
    (distance: number) => {
      // Apply resistance to make pulling feel more natural
      const resistedDistance = distance * resistance;
      const clampedDistance = Math.min(resistedDistance, maxDistance);

      setState((prev) => ({
        ...prev,
        pullDistance: clampedDistance,
        canRefresh: clampedDistance >= threshold
      }));
    },
    [resistance, maxDistance, threshold]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !containerRef.current) return;

      const container = containerRef.current;
      const isAtTop = container.scrollTop === 0;

      if (!isAtTop) return;

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;

      setState((prev) => ({
        ...prev,
        isPulling: true,
        pullDistance: 0,
        canRefresh: false
      }));
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!state.isPulling || !enabled) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault();
        updatePullDistance(deltaY);
      }
    },
    [state.isPulling, enabled, updatePullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || !enabled) return;

    setState((prev) => ({
      ...prev,
      isPulling: false
    }));

    if (state.canRefresh && !state.isRefreshing) {
      setState((prev) => ({
        ...prev,
        isRefreshing: true
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error("Pull to refresh failed:", error);
      } finally {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      // Animate back to 0
      setState((prev) => ({
        ...prev,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [state.isPulling, state.canRefresh, state.isRefreshing, enabled, onRefresh]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate refresh indicator styles
  const getRefreshIndicatorStyle = useCallback(() => {
    const opacity = Math.min(state.pullDistance / threshold, 1);
    const rotation = (state.pullDistance / threshold) * 360;

    return {
      transform: `translateY(${state.pullDistance}px) rotate(${rotation}deg)`,
      opacity,
      transition: state.isPulling ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };
  }, [state.pullDistance, state.isPulling, threshold]);

  // Calculate container styles
  const getContainerStyle = useCallback(() => {
    return {
      transform: `translateY(${state.pullDistance}px)`,
      transition: state.isPulling ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };
  }, [state.pullDistance, state.isPulling]);

  return {
    containerRef,
    ...state,
    getRefreshIndicatorStyle,
    getContainerStyle,
    refresh: async () => {
      if (state.isRefreshing) return;

      setState((prev) => ({ ...prev, isRefreshing: true }));
      try {
        await onRefresh();
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    }
  };
}
