import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { PlusRowButton } from "./plus-row-button";

const noop = (): void => undefined;

describe("PlusRowButton", () => {
  it("renders the label text passed via the label prop", () => {
    render(<PlusRowButton onClick={noop} label="Add session" />);

    expect(screen.getByRole("button", { name: /Add session/i })).toBeInTheDocument();
  });

  it("renders an Add icon inside the icon-circle wrapper", () => {
    render(<PlusRowButton onClick={noop} label="Add session" />);

    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
  });

  it("uses the MuiButton-outlined variant via the underlying Button", () => {
    const { container } = render(<PlusRowButton onClick={noop} label="Add block" />);
    const button = container.querySelector(".MuiButton-root");

    expect(button).not.toBeNull();
    expect(button).toHaveClass("MuiButton-outlined");
  });

  it("applies dashed border style via the composite-internal sx", () => {
    render(<PlusRowButton onClick={noop} label="Add session" />);
    const button = screen.getByRole("button", { name: /Add session/i });

    expect(button).toHaveStyle({ borderStyle: "dashed" });
  });

  it("applies alignSelf flex-start so the composite owns natural width inside Stack columns", () => {
    render(<PlusRowButton onClick={noop} label="Add session" />);
    const button = screen.getByRole("button", { name: /Add session/i });

    expect(button).toHaveStyle({ alignSelf: "flex-start" });
  });

  it("disables the button when disabled is true", () => {
    render(<PlusRowButton onClick={noop} label="Add session" disabled />);
    const button = screen.getByRole("button", { name: /Add session/i });

    expect(button).toBeDisabled();
  });

  it("invokes onClick exactly once when clicked", () => {
    const handler = vi.fn();

    render(<PlusRowButton onClick={handler} label="Add session" />);
    const button = screen.getByRole("button", { name: /Add session/i });

    fireEvent.click(button);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("aria-hides the icon-circle wrapper so screen readers skip the decorative glyph", () => {
    const { container } = render(<PlusRowButton onClick={noop} label="Add session" />);
    const ariaHidden = container.querySelector('[aria-hidden="true"]');

    expect(ariaHidden).not.toBeNull();
    expect(ariaHidden?.querySelector('[data-testid="AddIcon"]')).not.toBeNull();
  });

  it("renders without crashing when label contains emoji and combining marks (QA-Must-C7-10)", () => {
    expect(() => render(<PlusRowButton onClick={noop} label="Add 🏋️‍♂️ session" />)).not.toThrow();

    expect(screen.getByRole("button", { name: /Add/ })).toBeInTheDocument();
  });

  it("renders without crashing when label contains RTL characters (QA-Must-C7-10)", () => {
    expect(() => render(<PlusRowButton onClick={noop} label="إضافة جلسة" />)).not.toThrow();

    expect(screen.getByRole("button", { name: "إضافة جلسة" })).toBeInTheDocument();
  });
});
