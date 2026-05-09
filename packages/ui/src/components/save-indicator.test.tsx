import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { SaveIndicator } from "./save-indicator";

describe("SaveIndicator", () => {
  it("renders nothing when status is clean", () => {
    const { container } = render(<SaveIndicator status="clean" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders an unsaved-changes chip when status is dirty", () => {
    render(<SaveIndicator status="dirty" />);

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("renders a saving chip when status is saving", () => {
    render(<SaveIndicator status="saving" />);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders a saved chip when status is saved", () => {
    render(<SaveIndicator status="saved" />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("renders the default error label and a retry button when status is error", () => {
    const onRetry = vi.fn();

    render(<SaveIndicator status="error" onRetry={onRetry} />);

    expect(screen.getByText("Save failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a custom errorMessage and omits Retry when onRetry is missing", () => {
    render(<SaveIndicator status="error" errorMessage="Network down" />);

    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
