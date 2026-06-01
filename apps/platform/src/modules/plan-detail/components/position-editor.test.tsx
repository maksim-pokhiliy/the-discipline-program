import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { POSITIONS } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { formatPosition } from "../lib/format-position";

import { PositionEditor } from "./position-editor";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const openSelect = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

describe("PositionEditor options", () => {
  it("renders the no-position sentinel plus all 11 positions in the listbox", () => {
    render(<PositionEditor value={null} onChange={onChange} />);

    openSelect();
    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByText("— no position —")).toBeInTheDocument();

    for (const position of POSITIONS) {
      expect(within(listbox).getByText(formatPosition(position))).toBeInTheDocument();
    }
  });

  it("labels options via formatPosition (lowercase, underscores to spaces)", () => {
    render(<PositionEditor value={null} onChange={onChange} />);

    openSelect();
    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByText("neutral grip")).toBeInTheDocument();
    expect(within(listbox).getByText("from box or sofa")).toBeInTheDocument();
  });
});

describe("PositionEditor selection", () => {
  it("emits the enum member when a position is picked", () => {
    render(<PositionEditor value={null} onChange={onChange} />);

    openSelect();
    fireEvent.click(within(screen.getByRole("listbox")).getByText("neutral grip"));

    expect(onChange).toHaveBeenCalledWith("NEUTRAL_GRIP");
  });

  it("emits null when the no-position sentinel is picked", () => {
    render(<PositionEditor value="NEUTRAL_GRIP" onChange={onChange} />);

    openSelect();
    fireEvent.click(within(screen.getByRole("listbox")).getByText("— no position —"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows the current selection as the formatted label", () => {
    render(<PositionEditor value="HOLD_FARM_CARRY" onChange={onChange} />);

    expect(screen.getByText("hold farm carry")).toBeInTheDocument();
  });
});
