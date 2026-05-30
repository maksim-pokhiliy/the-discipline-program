import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { EmomSlotForm, emomSlotDefaultParams } from "./emom-slot-schema-form";
import { parseArchetypeParams } from "./schema-form-utils";
import { SchemaParamFormDispatch } from "./schema-param-form-dispatch";

const ARCHETYPE = "emom-sub-minute-slot";

const parseError = (params: unknown): FieldErrors => {
  const result = parseArchetypeParams(ARCHETYPE, params);

  if (result.ok) {
    throw new Error("expected the slot params to be rejected");
  }

  return result.error;
};

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("EmomSlotForm kind toggle", () => {
  it("renders the single-minute field for the default single slot", () => {
    render(<EmomSlotForm value={emomSlotDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Minute" })).toBeInTheDocument();
  });

  it("seeds a grouped slot of [1,3,5] when switching from single to grouped", () => {
    render(<EmomSlotForm value={{ slot: { kind: "single", minute: 1 } }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Grouped minutes" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ slot: { kind: "grouped", minutes: [1, 3, 5] } });
  });

  it("seeds a single slot of minute 1 when switching from grouped to single", () => {
    render(
      <EmomSlotForm
        value={{ slot: { kind: "grouped", minutes: [1, 3, 5] } }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Single minute" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ slot: { kind: "single", minute: 1 } });
  });

  it("ignores a click on the already-selected kind (deselect-null guard)", () => {
    render(<EmomSlotForm value={{ slot: { kind: "single", minute: 1 } }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Single minute" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("EmomSlotForm grouped rendering", () => {
  it("renders the StepArrayFields cells for a grouped slot", () => {
    render(
      <EmomSlotForm
        value={{ slot: { kind: "grouped", minutes: [1, 3, 5] } }}
        onChange={onChange}
      />,
    );

    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add step" })).toBeInTheDocument();
  });

  it("emits a grouped slot with a minute duplicating the last when add step is clicked", () => {
    render(
      <EmomSlotForm value={{ slot: { kind: "grouped", minutes: [1, 3] } }} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "add step" }));

    expect(onChange).toHaveBeenCalledWith({ slot: { kind: "grouped", minutes: [1, 3, 3] } });
  });

  it("emits the typed minute on the single field", () => {
    render(<EmomSlotForm value={{ slot: { kind: "single", minute: 1 } }} onChange={onChange} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: "Minute" }), {
      target: { value: "3" },
    });

    expect(onChange).toHaveBeenCalledWith({ slot: { kind: "single", minute: 3 } });
  });
});

describe("EmomSlotForm slot-union error surfacing", () => {
  it("surfaces the grouped .min(2) union error mapped by the real validator", () => {
    const error = parseError({ slot: { kind: "grouped", minutes: [1] } });

    render(
      <SchemaParamFormDispatch
        archetype={ARCHETYPE}
        value={{ slot: { kind: "grouped", minutes: [1] } }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Array must contain at least 2 element(s)")).toBeInTheDocument();
  });

  it("surfaces a single-minute error mapped by the real validator", () => {
    const error = parseError({ slot: { kind: "single", minute: 0 } });

    render(
      <SchemaParamFormDispatch
        archetype={ARCHETYPE}
        value={{ slot: { kind: "single", minute: 0 } }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });
});
