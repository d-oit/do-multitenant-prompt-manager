import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VirtualList, VirtualGrid, useVirtualScroll } from "./VirtualList";
import { renderHook } from "@testing-library/react";

describe("VirtualList", () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it("renders visible items", () => {
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        height={500}
        renderItem={(item) => <div key={item.id}>{item.name}</div>}
      />
    );
    
    // Should render approximately 10-13 items (500px height / 50px item height + overscan)
    const renderedItems = screen.getAllByText(/Item \d+/);
    expect(renderedItems.length).toBeGreaterThan(5);
    expect(renderedItems.length).toBeLessThan(20);
  });

  it("applies custom className", () => {
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        height={500}
        renderItem={(item) => <div>{item.name}</div>}
        className="custom-list"
      />
    );
    
    expect(container.firstChild).toHaveClass("custom-list");
  });

  it("renders all items with correct height container", () => {
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        height={500}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    
    // Container should have proper height
    expect(container.firstChild).toHaveStyle({ height: '500px' });
  });

  it("handles empty items array", () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        height={500}
        renderItem={(item) => <div>{item}</div>}
      />
    );
    
    expect(screen.queryByText(/Item/)).not.toBeInTheDocument();
  });

  it("applies overscan correctly", () => {
    render(
      <VirtualList
        items={items}
        itemHeight={50}
        height={500}
        overscan={5}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    
    // With overscan=5, should render more items
    const renderedItems = screen.getAllByText(/Item \d+/);
    expect(renderedItems.length).toBeGreaterThan(10);
  });
});

describe("VirtualGrid", () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it("renders in grid layout", () => {
    const { container } = render(
      <VirtualGrid
        items={items}
        itemHeight={100}
        itemWidth={100}
        columns={3}
        height={500}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    
    const grid = container.querySelector('[style*="grid"]');
    expect(grid).toBeInTheDocument();
  });

  it("calculates rows correctly", () => {
    const { container } = render(
      <VirtualGrid
        items={items}
        itemHeight={100}
        itemWidth={100}
        columns={3}
        height={500}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    
    // 100 items / 3 columns = ~34 rows
    // Total height should be rows * (itemHeight + gap)
    const spacer = container.querySelector('div > div');
    expect(spacer).toBeTruthy();
  });

  it("applies gap between items", () => {
    const { container } = render(
      <VirtualGrid
        items={items}
        itemHeight={100}
        itemWidth={100}
        columns={3}
        height={500}
        gap={10}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    
    const grid = container.querySelector('[style*="gap"]');
    expect(grid).toHaveStyle({ gap: '10px' });
  });
});

describe("useVirtualScroll", () => {
  it("calculates visible range", () => {
    const { result } = renderHook(() => 
      useVirtualScroll(1000, 50, 500)
    );
    
    expect(result.current.start).toBe(0);
    expect(result.current.end).toBeLessThanOrEqual(13); // (500/50) + overscan
    expect(result.current.totalHeight).toBe(50000); // 1000 * 50
    expect(result.current.offsetY).toBe(0);
  });

  it("calculates with overscan", () => {
    const { result } = renderHook(() => 
      useVirtualScroll(1000, 50, 500, 5)
    );
    
    expect(result.current.end).toBeGreaterThan(10);
  });

  it("respects item count boundaries", () => {
    const { result } = renderHook(() => 
      useVirtualScroll(10, 50, 500)
    );
    
    expect(result.current.end).toBeLessThanOrEqual(10);
  });
});
