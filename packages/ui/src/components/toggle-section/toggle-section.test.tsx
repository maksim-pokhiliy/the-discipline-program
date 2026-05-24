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

  it("renders the header as a non-interactive container when onToggle is undefined (MT-01)", () => {
    const { container } = render(
      <ToggleSection on={false} label="Static">
        <span>Body</span>
      </ToggleSection>,
    );

    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector(".MuiButtonBase-root")).toBeNull();
  });

  it("renders the header as a ButtonBase when onToggle is defined (MT-01)", () => {
    const { container } = render(
      <ToggleSection on={false} label="Interactive" onToggle={vi.fn()}>
        <span>Body</span>
      </ToggleSection>,
    );
    const button = container.querySelector("button.MuiButtonBase-root");

    expect(button).not.toBeNull();
    expect(button?.getAttribute("type")).toBe("button");
  });

  it("exposes the header as a keyboard-activatable native button (MT-02)", () => {
    const { container } = render(
      <ToggleSection on={false} label="Warmup" onToggle={vi.fn()}>
        <span>Body</span>
      </ToggleSection>,
    );
    const button = container.querySelector("button.MuiButtonBase-root");

    if (button === null) {
      throw new Error("ButtonBase not rendered");
    }

    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("disabled")).toBeNull();
    expect(button.getAttribute("aria-disabled")).not.toBe("true");

    const tabIndex = button.getAttribute("tabindex");

    expect(tabIndex === null || Number.parseInt(tabIndex, 10) >= 0).toBe(true);
  });

  it("activates onToggle when the header is invoked (Enter/Space delegate to click, MT-02)", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ToggleSection on={false} label="Warmup" onToggle={onToggle}>
        <span>Body</span>
      </ToggleSection>,
    );
    const button = container.querySelector("button.MuiButtonBase-root");

    if (button === null) {
      throw new Error("ButtonBase not rendered");
    }

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
