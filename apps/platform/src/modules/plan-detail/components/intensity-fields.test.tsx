import { fireEvent, screen, within } from "@testing-library/react";
import type { FieldErrors, GlobalError } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { EffortPercent, NumericPaceIntensity } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";

const getToggleButton = (name: string): HTMLElement => screen.getByRole("button", { name });

const getSelectedButtons = (): HTMLElement[] => screen.queryAllByRole("button", { pressed: true });

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("RpeField default-on-enable / clear", () => {
  it("seeds the prototype default { value: 8 } when toggled on from off", () => {
    render(<RpeField value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText("RPE"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ value: 8 });
  });

  it("clears to undefined when toggled off", () => {
    render(<RpeField value={{ value: 8 }} onChange={onChange} />);

    fireEvent.click(screen.getByText("RPE"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

describe("RpeField value selection", () => {
  it("calls onChange with the picked value when an unselected chip is clicked", () => {
    render(<RpeField value={{ value: 8 }} onChange={onChange} />);

    fireEvent.click(getToggleButton("9"));

    expect(onChange).toHaveBeenCalledWith({ value: 9 });
  });

  it("ignores deselect-null on rpe (QA-2)", () => {
    render(<RpeField value={{ value: 8 }} onChange={onChange} />);

    fireEvent.click(getToggleButton("8"));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("RpeField off-grid value (D-12 / QA-7)", () => {
  it("shows no chip selected for an off-grid value and does not crash", () => {
    render(<RpeField value={{ value: 6.5 }} onChange={onChange} />);

    expect(getSelectedButtons()).toHaveLength(0);
  });

  it("replaces the off-grid value with a real chip on click", () => {
    render(<RpeField value={{ value: 6.5 }} onChange={onChange} />);

    fireEvent.click(getToggleButton("8"));

    expect(onChange).toHaveBeenCalledWith({ value: 8 });
  });
});

describe("PaceField default-on-enable / clear / select", () => {
  it("seeds the prototype default 'moderate' when toggled on", () => {
    render(<PaceField value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText("Pace"));

    expect(onChange).toHaveBeenCalledWith("moderate");
  });

  it("clears to undefined when toggled off", () => {
    render(<PaceField value="moderate" onChange={onChange} />);

    fireEvent.click(screen.getByText("Pace"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with the picked pace when an unselected chip is clicked", () => {
    render(<PaceField value="moderate" onChange={onChange} />);

    fireEvent.click(getToggleButton("Hard"));

    expect(onChange).toHaveBeenCalledWith("hard");
  });

  it("ignores deselect-null on pace (QA-2)", () => {
    render(<PaceField value="moderate" onChange={onChange} />);

    fireEvent.click(getToggleButton("Moderate"));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("HrZoneField default-on-enable / clear / select", () => {
  it("seeds the prototype default { zone: 'Z2' } when toggled on", () => {
    render(<HrZoneField value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText("HR zone"));

    expect(onChange).toHaveBeenCalledWith({ zone: "Z2" });
  });

  it("clears to undefined when toggled off", () => {
    render(<HrZoneField value={{ zone: "Z2" }} onChange={onChange} />);

    fireEvent.click(screen.getByText("HR zone"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with the picked zone when an unselected segment is clicked", () => {
    render(<HrZoneField value={{ zone: "Z2" }} onChange={onChange} />);

    fireEvent.click(getToggleButton("Z4"));

    expect(onChange).toHaveBeenCalledWith({ zone: "Z4" });
  });

  it("ignores deselect-null on hr-zone (QA-2)", () => {
    render(<HrZoneField value={{ zone: "Z2" }} onChange={onChange} />);

    fireEvent.click(getToggleButton("Z2"));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("NumericPaceField default-on-enable / clear / direction", () => {
  it("seeds the prototype default when toggled on", () => {
    render(<NumericPaceField value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText("Numeric pace"));

    expect(onChange).toHaveBeenCalledWith({
      value: "5:00",
      distanceUnit: "km",
      paceType: "min_per_distance",
    });
  });

  it("clears to undefined when toggled off", () => {
    render(
      <NumericPaceField
        value={{ value: "5:00", distanceUnit: "km", paceType: "min_per_distance" }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText("Numeric pace"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with the picked direction when an unselected segment is clicked", () => {
    render(
      <NumericPaceField
        value={{ value: "5:00", distanceUnit: "km", paceType: "min_per_distance" }}
        onChange={onChange}
      />,
    );

    fireEvent.click(getToggleButton("dist / min"));

    expect(onChange).toHaveBeenCalledWith({
      value: "5:00",
      distanceUnit: "km",
      paceType: "distance_per_min",
    });
  });

  it("ignores deselect-null on numeric-pace direction (QA-2)", () => {
    render(
      <NumericPaceField
        value={{ value: "5:00", distanceUnit: "km", paceType: "min_per_distance" }}
        onChange={onChange}
      />,
    );

    fireEvent.click(getToggleButton("time / dist"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("surfaces the value error in the TextField when an error prop is passed (QA-1)", () => {
    const error: FieldErrors<NumericPaceIntensity> = {
      value: { type: "too_small", message: "value is required" },
    };

    render(
      <NumericPaceField
        value={{ value: "", distanceUnit: "km", paceType: "min_per_distance" }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("value is required")).toBeInTheDocument();
  });
});

describe("EffortPercentField default-on-enable / clear", () => {
  it("seeds the prototype default { value: 80 } when toggled on", () => {
    render(<EffortPercentField value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByText("Effort %"));

    expect(onChange).toHaveBeenCalledWith({ value: 80 });
  });

  it("clears to undefined when toggled off", () => {
    render(<EffortPercentField value={{ value: 80 }} onChange={onChange} />);

    fireEvent.click(screen.getByText("Effort %"));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});

describe("EffortPercentField single <-> range mode switch", () => {
  it("switches single to range with the prototype default range", () => {
    render(<EffortPercentField value={{ value: 80 }} onChange={onChange} />);

    fireEvent.click(getToggleButton("range"));

    expect(onChange).toHaveBeenCalledWith({ range: { min: 75, max: 85 } });
  });

  it("switches range to single with the prototype default value", () => {
    render(<EffortPercentField value={{ range: { min: 75, max: 85 } }} onChange={onChange} />);

    fireEvent.click(getToggleButton("single"));

    expect(onChange).toHaveBeenCalledWith({ value: 80 });
  });

  it("renders both min and max inputs in range mode", () => {
    render(<EffortPercentField value={{ range: { min: 75, max: 85 } }} onChange={onChange} />);
    const inputs = screen.getAllByRole("spinbutton");

    expect(inputs).toHaveLength(2);
  });
});

describe("EffortPercentField error surfacing (QA-1)", () => {
  it("renders the value TextField in error state when an error prop is passed", () => {
    const root: GlobalError = { message: "must be 1–100" };
    const error: FieldErrors<EffortPercent> = { root };
    const { container } = render(
      <EffortPercentField value={{ value: 80 }} onChange={onChange} error={error} />,
    );

    expect(container.querySelector(".MuiInputBase-root.Mui-error")).not.toBeNull();
    expect(screen.getByText("must be 1–100")).toBeInTheDocument();
  });
});

describe("Intensity fields disabled cascade (QA-11)", () => {
  it("disables the head button on every axis when disabled is set", () => {
    const { container, rerender } = render(
      <RpeField value={{ value: 8 }} onChange={onChange} disabled={true} />,
    );

    expect(container.querySelector("button.MuiButtonBase-root")?.getAttribute("disabled")).not.toBe(
      null,
    );

    rerender(<PaceField value="moderate" onChange={onChange} disabled={true} />);
    expect(container.querySelector("button.MuiButtonBase-root")?.getAttribute("disabled")).not.toBe(
      null,
    );
  });

  it("disables the inner value segments when disabled is set", () => {
    render(<HrZoneField value={{ zone: "Z2" }} onChange={onChange} disabled={true} />);
    const group = screen.getByRole("group");

    for (const button of within(group).getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
