import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { ToggleSection } from "./toggle-section";

describe("ToggleSection", () => {
  it("renders the header row in the off state without the body", () => {
    render(
      <ToggleSection on={false} label="Warmup">
        <span data-testid="toggle-body">Body content</span>
      </ToggleSection>,
    );

    expect(screen.getByText("Warmup")).toBeInTheDocument();
    expect(screen.queryByTestId("toggle-body")).not.toBeInTheDocument();
  });

  it("renders the body when on is true", () => {
    render(
      <ToggleSection on={true} label="Warmup">
        <span data-testid="toggle-body">Body content</span>
      </ToggleSection>,
    );

    expect(screen.getByTestId("toggle-body")).toBeInTheDocument();
  });

  it("calls onToggle when the header is clicked", () => {
    const onToggle = vi.fn();

    render(
      <ToggleSection on={false} label="Warmup" onToggle={onToggle}>
        <span>Body</span>
      </ToggleSection>,
    );

    fireEvent.click(screen.getByText("Warmup"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders the helper text only when provided", () => {
    const { rerender } = render(
      <ToggleSection on={false} label="Warmup" helper="Optional helper">
        <span>Body</span>
      </ToggleSection>,
    );

    expect(screen.getByText("Optional helper")).toBeInTheDocument();

    rerender(
      <ToggleSection on={false} label="Warmup">
        <span>Body</span>
      </ToggleSection>,
    );

    expect(screen.queryByText("Optional helper")).not.toBeInTheDocument();
  });
});
