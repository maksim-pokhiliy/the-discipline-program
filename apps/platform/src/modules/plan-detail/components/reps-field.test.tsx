import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RepNotation } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { RepsField } from "./reps-field";

const onChange = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("RepsField kind switching", () => {
  it("emits a count default when switching to Count from cleared", () => {
    render(<RepsField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Count" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "count", value: 1 });
  });

  it("emits a range default when switching to Range", () => {
    render(<RepsField value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Range" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "range", min: 1, max: 2 });
  });

  it("emits a unit_bound default when switching to Time·dist", () => {
    render(<RepsField value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Time·dist" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "unit_bound", unit: "sec", value: 1 });
  });

  it("emits a bare max when switching to Max", () => {
    render(<RepsField value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Max" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "max" });
  });

  it("does not re-emit when the active kind is clicked again", () => {
    render(<RepsField value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Count" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("RepsField clear", () => {
  it("clears the value to null via inherit", () => {
    render(<RepsField value={{ kind: "count", value: 5 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "inherit" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("RepsField body editing", () => {
  it("emits the edited count value", () => {
    const value: RepNotation = { kind: "count", value: 5 };

    render(<RepsField value={value} onChange={onChange} />);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "8" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "count", value: 8 });
  });
});
