import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { SideField } from "./side-field";

const onChange = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("SideField option mapping", () => {
  it("emits each_arm when Each arm is chosen", () => {
    render(<SideField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Each arm" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "each_arm" });
  });

  it("emits each_leg when Each leg is chosen", () => {
    render(<SideField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Each leg" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "each_leg" });
  });

  it("emits alternating when Alternating is chosen", () => {
    render(<SideField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Alternating" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "alternating" });
  });

  it("emits an explicit_split left when Left is chosen", () => {
    render(<SideField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Left" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "explicit_split", side: "left" });
  });

  it("emits an explicit_split right when Right is chosen", () => {
    render(<SideField value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Right" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "explicit_split", side: "right" });
  });

  it("clears to null when — is chosen", () => {
    render(<SideField value={{ kind: "each_leg" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "—" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("SideField per-limb count", () => {
  it("shows the per-limb field only for each_leg and each_arm", () => {
    const { rerender } = render(<SideField value={{ kind: "each_leg" }} onChange={onChange} />);

    expect(screen.getByRole("spinbutton")).toBeInTheDocument();

    rerender(<SideField value={{ kind: "alternating" }} onChange={onChange} />);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("emits the per-limb count for each_leg", () => {
    render(<SideField value={{ kind: "each_leg" }} onChange={onChange} />);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });

    expect(onChange).toHaveBeenCalledWith({ kind: "each_leg", countPerLimb: 3 });
  });

  it("drops the per-limb count when switching each_leg to each_arm (QA-013)", () => {
    render(<SideField value={{ kind: "each_leg", countPerLimb: 3 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Each arm" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "each_arm" });
  });
});
