import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors, GlobalError } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { CountOrRange } from "./count-or-range-field";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getSpinButtons = (): HTMLElement[] => screen.getAllByRole("spinbutton");

describe("CountOrRange exact mode", () => {
  it("renders a single count field for a numeric value", () => {
    render(<CountOrRange value={5} onChange={onChange} />);

    expect(getSpinButtons()).toHaveLength(1);
    expect(screen.getByRole("button", { name: "range" })).toBeInTheDocument();
  });

  it("seeds { min: value, max: value + 1 } when switching to range", () => {
    render(<CountOrRange value={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "range" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ min: 5, max: 6 });
  });

  it("emits the typed number on edit", () => {
    render(<CountOrRange value={5} onChange={onChange} />);

    fireEvent.change(getSpinButtons()[0] as HTMLElement, { target: { value: "8" } });

    expect(onChange).toHaveBeenCalledWith(8);
  });
});

describe("CountOrRange range mode", () => {
  it("renders min and max fields for a range value", () => {
    render(<CountOrRange value={{ min: 3, max: 5 }} onChange={onChange} />);

    expect(getSpinButtons()).toHaveLength(2);
    expect(screen.getByRole("button", { name: "exact" })).toBeInTheDocument();
  });

  it("collapses to the min when switching back to exact", () => {
    render(<CountOrRange value={{ min: 3, max: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "exact" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("emits an updated min while preserving max", () => {
    render(<CountOrRange value={{ min: 3, max: 5 }} onChange={onChange} />);

    fireEvent.change(getSpinButtons()[0] as HTMLElement, { target: { value: "4" } });

    expect(onChange).toHaveBeenCalledWith({ min: 4, max: 5 });
  });

  it("emits an updated max while preserving min", () => {
    render(<CountOrRange value={{ min: 3, max: 5 }} onChange={onChange} />);

    fireEvent.change(getSpinButtons()[1] as HTMLElement, { target: { value: "7" } });

    expect(onChange).toHaveBeenCalledWith({ min: 3, max: 7 });
  });
});

describe("CountOrRange refine error surfacing", () => {
  it("renders the root refine message on the Max field (min<max boundary)", () => {
    const root: GlobalError = { type: "custom", message: "range.min must be less than range.max" };
    const error: FieldErrors<{ min: number; max: number }> = { root };

    render(<CountOrRange value={{ min: 9, max: 3 }} onChange={onChange} error={error} />);

    expect(screen.getByText("range.min must be less than range.max")).toBeInTheDocument();
  });
});
