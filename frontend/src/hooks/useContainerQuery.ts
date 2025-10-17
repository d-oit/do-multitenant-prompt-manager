/**
 * Container Query Hook
 * Provides container-based responsive behavior for components
 */

import { useEffect, useRef, useState } from "react";

interface ContainerQueryOptions {
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  axis?: 'width' | 'height' | 'both';
}

interface ContainerQueryResult {
  containerRef: React.RefObject<HTMLElement>;
  matches: {
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
  };
  dimensions: {
    width: number;
    height: number;
  };
}

const defaultBreakpoints = {
  sm: 320,
  md: 640,
  lg: 1024,
  xl: 1280,
};

export function useContainerQuery(options: ContainerQueryOptions = {}): ContainerQueryResult {
  const { breakpoints = defaultBreakpoints, axis = 'width' } = options;
  const containerRef = useRef<HTMLElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [matches, setMatches] = useState({
    sm: false,
    md: false,
    lg: false,
    xl: false,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      const newDimensions = {
        width: rect.width,
        height: rect.height,
      };

      setDimensions(newDimensions);

      // Determine which breakpoints match based on axis
      const size = axis === 'height' ? newDimensions.height : newDimensions.width;
      
      setMatches({
        sm: size >= (breakpoints.sm || defaultBreakpoints.sm),
        md: size >= (breakpoints.md || defaultBreakpoints.md),
        lg: size >= (breakpoints.lg || defaultBreakpoints.lg),
        xl: size >= (breakpoints.xl || defaultBreakpoints.xl),
      });
    };

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(element);
    updateDimensions(); // Initial measurement

    return () => {
      resizeObserver.disconnect();
    };
  }, [breakpoints.sm, breakpoints.md, breakpoints.lg, breakpoints.xl, axis]);

  return {
    containerRef: containerRef as React.RefObject<HTMLElement>,
    matches,
    dimensions,
  };
}

// Utility hook for responsive component behavior
export function useResponsiveColumns(
  minColumnWidth: number = 280,
  gap: number = 16,
  maxColumns?: number
) {
  const { containerRef, dimensions } = useContainerQuery();
  
  const calculateColumns = () => {
    if (dimensions.width === 0) return 1;
    
    const availableWidth = dimensions.width - gap;
    const possibleColumns = Math.floor(availableWidth / (minColumnWidth + gap));
    const columns = Math.max(1, possibleColumns);
    
    return maxColumns ? Math.min(columns, maxColumns) : columns;
  };

  const columns = calculateColumns();

  return {
    containerRef,
    columns,
    columnWidth: columns > 0 ? (dimensions.width - (gap * (columns - 1))) / columns : '100%',
  };
}