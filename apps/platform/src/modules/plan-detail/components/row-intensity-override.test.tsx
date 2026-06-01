import { fireEvent, screen } from "@testing-library/react";
import type { FieldError, FieldErrors } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { RowIntensityOverride } from "./row-intensity-override";
import type { ShellIntensityForm } from "./schema-form-utils";

const onChange: Mock = vi.fn();

const effortPercentRootError = (message: string): FieldErrors<ShellIntensityForm> => {
  const root: FieldError = { type: "custom", message };

  return { effortPercent: { root } };
};

afterEach(() => {
  onChange.mockReset();
});

describe("RowIntensityOverride collapsed state", () => {
  it("renders only the add-override button when value is null", () => {
    render(<RowIntensityOverride value={null} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "+ add intensity override" })).toBeInTheDocument();
    expect(screen.queryByText("Effort %")).toBeNull();
  });

  it("opens an empty override object when the add button is clicked", () => {
    render(<RowIntensityOverride value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "+ add intensity override" }));

    expect(onChange).toHaveBeenCalledWith({});
  });
});

describe("RowIntensityOverride expanded state", () => {
  it("renders all 5 intensity axes plus the remove button when value is non-null", () => {
    render(<RowIntensityOverride value={{}} onChange={onChange} />);

    for (const label of ["Effort %", "RPE", "Pace", "HR zone", "Numeric pace"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: "remove override" })).toBeInTheDocument();
  });

  it("emits null when the remove button is clicked", () => {
    render(<RowIntensityOverride value={{}} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "remove override" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("merges a toggled axis into the existing override value", () => {
    render(<RowIntensityOverride value={{}} onChange={onChange} />);

    fireEvent.click(screen.getByText("Effort %"));

    expect(onChange).toHaveBeenCalledWith({ effortPercent: { value: 80 } });
  });
});

describe("RowIntensityOverride error threading", () => {
  it("surfaces the effort-percent refine message on a single field", () => {
    render(
      <RowIntensityOverride
        value={{ effortPercent: { value: 80 } }}
        onChange={onChange}
        error={effortPercentRootError("must be 1–100")}
      />,
    );

    expect(screen.getAllByText("must be 1–100")).toHaveLength(1);
  });
});
