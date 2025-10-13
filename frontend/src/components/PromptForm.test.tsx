import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PromptForm from "./PromptForm";

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    options
  }: {
    value: string;
    onChange: (value: string | undefined) => void;
    options?: { ariaLabel?: string };
  }) => (
    <textarea
      aria-label={options?.ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}));

describe("PromptForm", () => {
  it("submits normalized values", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PromptForm mode="create" tenantId="default" onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "  Example Prompt  ");
    await user.type(screen.getByRole("textbox", { name: /body/i }), "Test body");
    await user.type(screen.getByLabelText(/tags/i), "one, two ");
    const metadataField = screen.getByLabelText(/metadata/i);
    fireEvent.change(metadataField, { target: { value: '{"category":"demo"}' } });

    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      tenantId: "default",
      title: "Example Prompt",
      body: "Test body",
      tags: ["one", "two"],
      metadata: { category: "demo" },
      archived: false
    });
  });

  it("shows error for invalid metadata", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PromptForm mode="create" tenantId="default" onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "Invalid metadata");
    await user.type(screen.getByRole("textbox", { name: /body/i }), "Body");
    await user.type(screen.getByLabelText(/metadata/i), "not json");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/metadata must be valid json/i)).toBeInTheDocument();
  });
});
