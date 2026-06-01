import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { PerLimbDistribution } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { SideEditor } from "./side-editor";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getOption = (name: string): HTMLElement => screen.getByRole("button", { name });

const getSpinButton = (): HTMLElement => screen.getByRole("spinbutton");

describe("SideEditor options", () => {
  it("renders all 5 side options including the none sentinel", () => {
    render(<SideEditor value={null} onChange={onChange} />);

    for (const label of ["—", "each leg", "each arm", "L / R", "alt."]) {
      expect(getOption(label)).toBeInTheDocument();
    }
  });

  it("selects the none sentinel when value is null", () => {
    render(<SideEditor value={null} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "—", pressed: true })).toBeInTheDocument();
  });

  it("emits null when the none option is picked", () => {
    render(<SideEditor value={{ kind: "each_leg" }} onChange={onChange} />);

    fireEvent.click(getOption("—"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("emits the each_leg kind when each leg is picked", () => {
    render(<SideEditor value={null} onChange={onChange} />);

    fireEvent.click(getOption("each leg"));

    expect(onChange).toHaveBeenCalledWith({ kind: "each_leg" });
  });

  it("emits the alternating kind when alt is picked", () => {
    render(<SideEditor value={null} onChange={onChange} />);

    fireEvent.click(getOption("alt."));

    expect(onChange).toHaveBeenCalledWith({ kind: "alternating" });
  });
});

describe("SideEditor countPerLimb optional / clearable", () => {
  it("shows the count-per-limb field only for each_leg / each_arm", () => {
    render(<SideEditor value={{ kind: "each_leg" }} onChange={onChange} />);

    expect(screen.getByText("count per limb (optional):")).toBeInTheDocument();
  });

  it("omits the count-per-limb key when the field is cleared", () => {
    render(<SideEditor value={{ kind: "each_leg", countPerLimb: 8 }} onChange={onChange} />);

    fireEvent.change(getSpinButton(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "each_leg" });
  });

  it("emits the typed count per limb", () => {
    render(<SideEditor value={{ kind: "each_leg" }} onChange={onChange} />);

    fireEvent.change(getSpinButton(), { target: { value: "12" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "each_leg", countPerLimb: 12 });
  });
});

describe("SideEditor countPerLimb invalid surfaces inline (QA-MT5, QA-002)", () => {
  it("renders the too-small message when countPerLimb is 0", () => {
    const error: FieldErrors<PerLimbDistribution> = {
      countPerLimb: { type: "too_small", message: "Number must be greater than 0" },
    };

    render(
      <SideEditor
        value={{ kind: "each_leg", countPerLimb: 0 }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });
});

describe("SideEditor explicit_split sub-toggle", () => {
  it("renders a left/right sub-toggle for explicit_split", () => {
    render(<SideEditor value={{ kind: "explicit_split", side: "left" }} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right" })).toBeInTheDocument();
  });

  it("emits the picked side for explicit_split", () => {
    render(<SideEditor value={{ kind: "explicit_split", side: "left" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Right" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "explicit_split", side: "right" });
  });

  it("defaults explicit_split to the left side when picked from the segment", () => {
    render(<SideEditor value={null} onChange={onChange} />);

    fireEvent.click(getOption("L / R"));

    expect(onChange).toHaveBeenCalledWith({ kind: "explicit_split", side: "left" });
  });
});
