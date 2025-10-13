import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ToastContainer, useToast, type Toast } from "./Toast";

describe("useToast", () => {
  it("adds toast when success is called", () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success("Success message");
    });
    
    expect(result.current.toasts.length).toBeGreaterThan(0);
    const lastToast = result.current.toasts[result.current.toasts.length - 1];
    expect(lastToast.message).toBe("Success message");
    expect(lastToast.variant).toBe("success");
  });

  it("adds toast when error is called", () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.error("Error message");
    });
    
    expect(result.current.toasts.length).toBeGreaterThan(0);
    const lastToast = result.current.toasts[result.current.toasts.length - 1];
    expect(lastToast.variant).toBe("error");
  });

  it("adds toast when warning is called", () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.warning("Warning message");
    });
    
    expect(result.current.toasts.length).toBeGreaterThan(0);
    const lastToast = result.current.toasts[result.current.toasts.length - 1];
    expect(lastToast.variant).toBe("warning");
  });

  it("removes toast when dismissToast is called", () => {
    const { result } = renderHook(() => useToast());
    const initialLength = result.current.toasts.length;
    
    act(() => {
      result.current.success("Message 1");
      result.current.success("Message 2");
    });
    
    const lengthAfterAdd = result.current.toasts.length;
    expect(lengthAfterAdd).toBeGreaterThan(initialLength);
    
    const toastId = result.current.toasts[result.current.toasts.length - 1].id;
    
    act(() => {
      result.current.dismissToast(toastId);
    });
    
    expect(result.current.toasts.length).toBe(lengthAfterAdd - 1);
  });
});

describe("ToastContainer", () => {
  it("renders multiple toasts", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Toast 1", variant: "info" },
      { id: "2", message: "Toast 2", variant: "success" }
    ];
    
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    
    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
  });

  it("renders nothing when no toasts", () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    // ToastContainer returns null when there are no toasts
    expect(container.firstChild).toBeNull();
  });
});
