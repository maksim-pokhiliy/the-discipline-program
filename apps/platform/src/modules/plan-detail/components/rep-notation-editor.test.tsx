import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors, GlobalError } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { RepNotation } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { RepNotationEditor } from "./rep-notation-editor";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getKindButton = (name: string): HTMLElement => screen.getByRole("button", { name });

const getSpinButtons = (): HTMLElement[] => screen.getAllByRole("spinbutton");

describe("RepNotationEditor kind segment", () => {
  it("renders all 7 rep-notation kind buttons", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    for (const label of ["Count", "Range", "Time/Dist", "Max", "Implicit", "Total", "Compound"]) {
      expect(getKindButton(label)).toBeInTheDocument();
    }
  });

  it("rebuilds to the range default when switching from count to range", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Range"));

    expect(onChange).toHaveBeenCalledWith({ kind: "range", min: 5, max: 10 });
  });

  it("rebuilds to the unit_bound default when switching to Time/Dist", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Time/Dist"));

    expect(onChange).toHaveBeenCalledWith({ kind: "unit_bound", unit: "sec", value: 30 });
  });

  it("rebuilds to the bare max default when switching to Max", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Max"));

    expect(onChange).toHaveBeenCalledWith({ kind: "max", subForm: "bare" });
  });

  it("rebuilds to the total_flag default when switching to Total", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Total"));

    expect(onChange).toHaveBeenCalledWith({ kind: "total_flag", value: 100 });
  });

  it("rebuilds to the bare implicit kind when switching to Implicit", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Implicit"));

    expect(onChange).toHaveBeenCalledWith({ kind: "implicit" });
  });

  it("rebuilds to the bare compound_rep_unit kind when switching to Compound", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(getKindButton("Compound"));

    expect(onChange).toHaveBeenCalledWith({ kind: "compound_rep_unit" });
  });
});

describe("RepNotationEditor max sub-form", () => {
  it("reveals the progressive seed field only when the progressive sub-form is picked", () => {
    render(
      <RepNotationEditor value={{ kind: "max", subForm: "progressive" }} onChange={onChange} />,
    );

    expect(screen.getByPlaceholderText("e.g. 3-3-3-2-2-1-1")).toBeInTheDocument();
  });

  it("does not render the target-exercise field for the max kind (D-07)", () => {
    render(<RepNotationEditor value={{ kind: "max", subForm: "bare" }} onChange={onChange} />);

    expect(screen.queryByText(/target exercise/i)).toBeNull();
  });
});

describe("RepNotationEditor implicit and compound hints", () => {
  it("shows the implicit hint copy for the implicit kind", () => {
    render(<RepNotationEditor value={{ kind: "implicit" }} onChange={onChange} />);

    expect(
      screen.getByText("no reps written — defined by surrounding context (ladder marker, etc.)"),
    ).toBeInTheDocument();
  });

  it("shows the compound hint copy for the compound_rep_unit kind", () => {
    render(<RepNotationEditor value={{ kind: "compound_rep_unit" }} onChange={onChange} />);

    expect(
      screen.getByText("a single rep is defined elsewhere via REP_DEFINITION row."),
    ).toBeInTheDocument();
  });
});

describe("RepNotationEditor range refine surfaces at root", () => {
  it("renders the contract refine message when min >= max (error.reps.root)", () => {
    const root: GlobalError = { type: "custom", message: "range.min must be < range.max" };
    const error: FieldErrors<RepNotation> = { root };

    render(
      <RepNotationEditor
        value={{ kind: "range", min: 10, max: 5 }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("range.min must be < range.max")).toBeInTheDocument();
  });
});

describe("RepNotationEditor leaf-field-clear surfaces inline (QA-MT4, QA-001)", () => {
  it("renders the too-small message on the count field when value is 0", () => {
    const error: FieldErrors<RepNotation> = {
      value: { type: "too_small", message: "Number must be greater than 0" },
    };

    render(
      <RepNotationEditor value={{ kind: "count", value: 0 }} onChange={onChange} error={error} />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });

  it("renders the too-small message on the total_flag field when value is 0", () => {
    const error: FieldErrors<RepNotation> = {
      value: { type: "too_small", message: "Number must be greater than 0" },
    };

    render(
      <RepNotationEditor
        value={{ kind: "total_flag", value: 0 }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });

  it("renders the message on the unit_bound single value field when it is cleared", () => {
    const error: FieldErrors<RepNotation> = {
      value: { type: "too_small", message: "Number must be greater than 0" },
    };

    render(
      <RepNotationEditor
        value={{ kind: "unit_bound", unit: "sec", value: 0 }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });

  it("renders the message on a range bound field when min is cleared (error.reps.min)", () => {
    const error: FieldErrors<RepNotation> = {
      min: { type: "invalid_type", message: "Expected number, received nan" },
    };

    render(
      <RepNotationEditor
        value={{ kind: "range", min: 5, max: 10 }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Expected number, received nan")).toBeInTheDocument();
  });
});

describe("RepNotationEditor emits leaf edits", () => {
  it("emits the typed count value", () => {
    render(<RepNotationEditor value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.change(getSpinButtons()[0] as HTMLElement, { target: { value: "8" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "count", value: 8 });
  });
});
