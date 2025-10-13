import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    await user.keyboard("{Escape}");
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const backdrop = document.querySelector(".modal-backdrop") as HTMLElement | null;
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click when closeOnBackdropClick is false", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnBackdropClick={false}>
        <p>Content</p>
      </Modal>
    );
    
    const backdrop = document.querySelector(".modal-backdrop") as HTMLElement | null;
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(handleClose).not.toHaveBeenCalled();
  });

  it("applies size classes", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Small" size="sm">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByRole("dialog")).toHaveClass("modal--sm");
    
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Large" size="lg">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByRole("dialog")).toHaveClass("modal--lg");
  });

  it("renders children content", () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={vi.fn()} 
        title="Test Modal"
      >
        <div>Custom content here</div>
      </Modal>
    );
    
    expect(screen.getByText("Custom content here")).toBeInTheDocument();
  });

  it("has proper ARIA attributes", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
  });
});
