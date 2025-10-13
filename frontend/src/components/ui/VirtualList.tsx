import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtual List component for rendering large lists efficiently
 * Only renders visible items + overscan buffer
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  overscan = 3,
  renderItem,
  className = "",
  onScroll
}: VirtualListProps<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + height) / itemHeight);
  
  // Apply overscan
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);
  
  // Get visible items
  const visibleItems = items.slice(start, end);
  
  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = start * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Scroll to top when items change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  const containerStyle: CSSProperties = {
    height: `${height}px`,
    overflow: 'auto',
    position: 'relative',
    willChange: 'transform'
  };

  const spacerStyle: CSSProperties = {
    height: `${totalHeight}px`,
    position: 'relative'
  };

  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transform: `translateY(${offsetY}px)`
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onScroll={handleScroll}
    >
      <div style={spacerStyle}>
        <div style={contentStyle}>
          {visibleItems.map((item, index) => (
            <div key={start + index} style={{ height: `${itemHeight}px` }}>
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  columns: number;
  height: number;
  gap?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

/**
 * Virtual Grid component for rendering large grids efficiently
 */
export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  columns,
  height,
  gap = 0,
  overscan = 1,
  renderItem,
  className = ""
}: VirtualGridProps<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate rows
  const rows = Math.ceil(items.length / columns);
  const rowHeight = itemHeight + gap;
  
  // Calculate visible range
  const visibleStartRow = Math.floor(scrollTop / rowHeight);
  const visibleEndRow = Math.ceil((scrollTop + height) / rowHeight);
  
  // Apply overscan
  const startRow = Math.max(0, visibleStartRow - overscan);
  const endRow = Math.min(rows, visibleEndRow + overscan);
  
  // Calculate item indices
  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);
  
  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex);
  
  // Calculate total height and offset
  const totalHeight = rows * rowHeight;
  const offsetY = startRow * rowHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const containerStyle: CSSProperties = {
    height: `${height}px`,
    overflow: 'auto',
    position: 'relative'
  };

  const spacerStyle: CSSProperties = {
    height: `${totalHeight}px`,
    position: 'relative'
  };

  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transform: `translateY(${offsetY}px)`,
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
    gap: `${gap}px`
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onScroll={handleScroll}
    >
      <div style={spacerStyle}>
        <div style={contentStyle}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling calculations
 */
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(itemCount, visibleEnd + overscan);
  
  const totalHeight = itemCount * itemHeight;
  const offsetY = start * itemHeight;

  return {
    start,
    end,
    totalHeight,
    offsetY,
    scrollTop,
    setScrollTop
  };
}

export default VirtualList;
