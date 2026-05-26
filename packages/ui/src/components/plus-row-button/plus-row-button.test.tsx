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

  it("renders the literal + glyph inside the icon-circle wrapper", () => {
    render(<PlusRowButton onClick={noop} label="Add session" />);

    expect(screen.getByText("+")).toBeInTheDocument();
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

  it("aria-hides the icon-circle wrapper so screen readers skip the glyph", () => {
    const { container } = render(<PlusRowButton onClick={noop} label="Add session" />);
    const ariaHidden = container.querySelector('[aria-hidden="true"]');

    expect(ariaHidden).not.toBeNull();
    expect(ariaHidden?.textContent).toBe("+");
  });
});
