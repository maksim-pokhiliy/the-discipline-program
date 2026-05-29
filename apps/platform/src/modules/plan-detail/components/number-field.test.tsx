import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { NumberField } from "./number-field";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getInput = (): HTMLInputElement => {
  const el = screen.getByRole("spinbutton");

  if (!(el instanceof HTMLInputElement)) {
    throw new Error("expected a number input");
  }

  return el;
};

describe("NumberField value rendering", () => {
  it("renders a finite numeric value", () => {
    render(<NumberField value={12} onChange={onChange} />);

    expect(getInput().value).toBe("12");
  });

  it("renders an empty string for a non-finite value (NaN seed)", () => {
    render(<NumberField value={NaN} onChange={onChange} />);

    expect(getInput().value).toBe("");
  });
});

describe("NumberField change coercion", () => {
  it("coerces a typed numeric string to a number", () => {
    render(<NumberField value={1} onChange={onChange} />);

    fireEvent.change(getInput(), { target: { value: "9" } });

    expect(onChange).toHaveBeenCalledWith(9);
  });

  it("emits 0 when the input is cleared", () => {
    render(<NumberField value={5} onChange={onChange} />);

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(0);
  });
});

describe("NumberField input attributes", () => {
  it("forwards min and step to the underlying input", () => {
    render(<NumberField value={1} onChange={onChange} min={1} step={1} />);
    const input = getInput();

    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("step", "1");
  });
});

describe("NumberField error state", () => {
  it("renders the helper text and marks the field invalid when error is set", () => {
    render(<NumberField value={0} onChange={onChange} error="Number must be greater than 0" />);

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
    expect(getInput()).toBeInvalid();
  });

  it("renders no error state when error is undefined", () => {
    render(<NumberField value={5} onChange={onChange} />);

    expect(getInput()).toBeValid();
  });
});

describe("NumberField disabled state", () => {
  it("disables the underlying input when disabled is set", () => {
    render(<NumberField value={5} onChange={onChange} disabled={true} />);

    expect(getInput()).toBeDisabled();
  });
});
