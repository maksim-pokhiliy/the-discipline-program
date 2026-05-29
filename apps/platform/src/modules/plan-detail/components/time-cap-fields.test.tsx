import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors, GlobalError } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { TimeCap } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { TimeCapFields } from "./time-cap-fields";

const onChange: Mock = vi.fn();

const getMinInput = (): HTMLElement => screen.getByPlaceholderText("—");
const getMaxInput = (): HTMLElement => screen.getByPlaceholderText("max");

afterEach(() => {
  onChange.mockReset();
});

describe("TimeCapFields min input", () => {
  it("clears the whole cap to null when min is emptied (QA-5)", () => {
    render(<TimeCapFields value={{ min: 8, max: 10, unit: "min" }} onChange={onChange} />);

    fireEvent.change(getMinInput(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("sets min on the existing cap when a value is typed", () => {
    render(<TimeCapFields value={{ min: 8, unit: "min" }} onChange={onChange} />);

    fireEvent.change(getMinInput(), { target: { value: "12" } });

    expect(onChange).toHaveBeenCalledWith({ min: 12, unit: "min" });
  });

  it("seeds a default unit when typing min from a null cap", () => {
    render(<TimeCapFields value={null} onChange={onChange} />);

    fireEvent.change(getMinInput(), { target: { value: "15" } });

    expect(onChange).toHaveBeenCalledWith({ min: 15, unit: "min" });
  });
});

describe("TimeCapFields max input", () => {
  it("seeds { min: 0, unit: 'min', max } from a null cap without crashing (QA-3)", () => {
    render(<TimeCapFields value={null} onChange={onChange} />);

    fireEvent.change(getMaxInput(), { target: { value: "12" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ min: 0, unit: "min", max: 12 });
  });

  it("removes max when the max input is emptied", () => {
    render(<TimeCapFields value={{ min: 8, max: 10, unit: "min" }} onChange={onChange} />);

    fireEvent.change(getMaxInput(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ min: 8, unit: "min", max: undefined });
  });
});

describe("TimeCapFields unit toggle", () => {
  it("switches the unit to sec when the sec segment is clicked", () => {
    render(<TimeCapFields value={{ min: 8, unit: "min" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "sec" }));

    expect(onChange).toHaveBeenCalledWith({ min: 8, unit: "sec" });
  });

  it("ignores deselect-null on time-cap unit (QA-2)", () => {
    render(<TimeCapFields value={{ min: 8, unit: "min" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "min" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("TimeCapFields presets", () => {
  it("sets { min: n, unit: 'min' } when a preset is clicked", () => {
    render(<TimeCapFields value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "12:00" }));

    expect(onChange).toHaveBeenCalledWith({ min: 12, unit: "min" });
  });

  it("marks the matching preset selected for a single-value min cap", () => {
    render(<TimeCapFields value={{ min: 12, unit: "min" }} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "12:00", pressed: true })).toBeInTheDocument();
  });

  it("ignores deselect-null on time-cap preset (QA-2)", () => {
    render(<TimeCapFields value={{ min: 12, unit: "min" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "12:00", pressed: true }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("TimeCapFields clear", () => {
  it("clears the cap to null when the clear button is clicked", () => {
    render(<TimeCapFields value={{ min: 8, unit: "min" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "clear" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("TimeCapFields error surfacing (QA-1)", () => {
  it("renders the min input in error state when a min error is passed", () => {
    const error: FieldErrors<TimeCap> = {
      min: { type: "too_small", message: "min must be positive" },
    };

    render(<TimeCapFields value={{ min: 0, unit: "min" }} onChange={onChange} error={error} />);

    expect(screen.getByText("min must be positive")).toBeInTheDocument();
  });

  it("renders the max input error from the refine root message", () => {
    const root: GlobalError = { message: "max must be > min when set" };
    const error: FieldErrors<TimeCap> = { root };

    render(
      <TimeCapFields value={{ min: 20, max: 5, unit: "min" }} onChange={onChange} error={error} />,
    );

    expect(screen.getByText("max must be > min when set")).toBeInTheDocument();
  });
});

describe("TimeCapFields disabled cascade (QA-11)", () => {
  it("disables the inputs and the clear button when disabled is set", () => {
    render(<TimeCapFields value={{ min: 8, unit: "min" }} onChange={onChange} disabled={true} />);

    expect(getMinInput()).toBeDisabled();
    expect(getMaxInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "clear" })).toBeDisabled();
  });
});
