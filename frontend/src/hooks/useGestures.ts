/**
 * Gesture Handling Hook
 * Provides touch gesture support for mobile interactions
 */

import { useCallback, useEffect, useRef } from "react";

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  velocity: number;
  duration: number;
}

interface GestureOptions {
  onSwipe?: (gesture: SwipeGesture) => void;
  onLongPress?: (event: TouchEvent) => void;
  onPinch?: (scale: number, event: TouchEvent) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventScroll?: boolean;
}

export function useGestures(options: GestureOptions = {}) {
  const {
    onSwipe,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    longPressDelay = 500,
    preventScroll = false,
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const initialPinchDistanceRef = useRef(0);

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
  }), []);

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateSwipeGesture = useCallback((start: TouchPoint, end: TouchPoint): SwipeGesture | null => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = end.timestamp - start.timestamp;

    if (distance < swipeThreshold || duration > 1000) {
      return null;
    }

    const velocity = distance / duration;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    let direction: SwipeGesture["direction"];
    if (absX > absY) {
      direction = deltaX > 0 ? "right" : "left";
    } else {
      direction = deltaY > 0 ? "down" : "up";
    }

    return {
      direction,
      distance,
      velocity,
      duration,
    };
  }, [swipeThreshold]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touches = event.touches;
    
    if (touches.length === 1) {
      // Single touch - potential swipe or long press
      touchStartRef.current = getTouchPoint(touches[0]);
      
      if (onLongPress) {
        longPressTimerRef.current = window.setTimeout(() => {
          onLongPress(event);
        }, longPressDelay);
      }
    } else if (touches.length === 2 && onPinch) {
      // Two touches - potential pinch
      isPinchingRef.current = true;
      initialPinchDistanceRef.current = getDistance(touches[0], touches[1]);
      
      // Clear long press timer
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (preventScroll) {
      event.preventDefault();
    }
  }, [getTouchPoint, getDistance, onLongPress, onPinch, longPressDelay, preventScroll]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touches = event.touches;

    // Clear long press timer on move
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touches.length === 2 && isPinchingRef.current && onPinch) {
      // Handle pinch gesture
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      onPinch(scale, event);
    }

    if (preventScroll) {
      event.preventDefault();
    }
  }, [getDistance, onPinch, preventScroll]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (event.changedTouches.length === 1 && touchStartRef.current && onSwipe) {
      // Handle swipe gesture
      touchEndRef.current = getTouchPoint(event.changedTouches[0]);
      const gesture = calculateSwipeGesture(touchStartRef.current, touchEndRef.current);
      
      if (gesture) {
        onSwipe(gesture);
      }
    }

    // Reset pinch state
    if (event.touches.length < 2) {
      isPinchingRef.current = false;
      initialPinchDistanceRef.current = 0;
    }

    // Reset touch points
    if (event.touches.length === 0) {
      touchStartRef.current = null;
      touchEndRef.current = null;
    }
  }, [getTouchPoint, calculateSwipeGesture, onSwipe]);

  const handleTouchCancel = useCallback(() => {
    // Clear all timers and reset state
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
    isPinchingRef.current = false;
    initialPinchDistanceRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  return gestureHandlers;
}

// Helper hook for swipe navigation
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options: Omit<GestureOptions, 'onSwipe'> = {}
) {
  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    if (gesture.direction === "left" && onSwipeLeft) {
      onSwipeLeft();
    } else if (gesture.direction === "right" && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return useGestures({
    ...options,
    onSwipe: handleSwipe,
  });
}