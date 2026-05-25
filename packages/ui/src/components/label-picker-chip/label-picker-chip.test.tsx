import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type Label } from "@repo/contracts/lms/label";

import { render } from "../../test/render";

import { LabelPickerChip } from "./label-picker-chip";

const baseDate = new Date("2025-01-01T00:00:00.000Z");

const buildLabel = (overrides: Partial<Label>): Label => ({
  id: "label-id",
  name: "Label",
  nameLower: "label",
  applicableLevels: ["DAY"],
  notes: null,
  rest: false,
  createdAt: baseDate,
  updatedAt: baseDate,
  ...overrides,
});

const dayOption = buildLabel({ id: "day-1", name: "MAIN" });
const restOption = buildLabel({ id: "day-2", name: "REST DAY", rest: true });
const skillOption = buildLabel({ id: "day-3", name: "SKILL" });

describe("LabelPickerChip", () => {
  it("renders placeholder when value is null", () => {
    render(<LabelPickerChip value={null} options={[dayOption]} level="DAY" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "—" })).toBeInTheDocument();
  });

  it("renders the label name when a value is present", () => {
    render(
      <LabelPickerChip
        value={dayOption}
        options={[dayOption, restOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "MAIN" })).toBeInTheDocument();
  });

  it("renders the rest tonal variant when value.rest is true", () => {
    const { container } = render(
      <LabelPickerChip
        value={restOption}
        options={[dayOption, restOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-colorPrimary");
  });

  it("opens the menu when the chip body is clicked", () => {
    render(
      <LabelPickerChip
        value={null}
        options={[dayOption, restOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "—" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("opens the menu when the trailing chevron is clicked", () => {
    const { container } = render(
      <LabelPickerChip
        value={null}
        options={[dayOption, restOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );
    const deleteIcon = container.querySelector(".MuiChip-deleteIcon");

    expect(deleteIcon).not.toBeNull();

    if (deleteIcon === null) {
      throw new Error("deleteIcon node missing");
    }

    fireEvent.click(deleteIcon);

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("fires onChange with the option id and closes the menu when an option is selected", () => {
    const onChange = vi.fn();

    render(
      <LabelPickerChip
        value={null}
        options={[dayOption, skillOption]}
        level="DAY"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "—" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "SKILL" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("day-3");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("fires onChange with null when the clear option is selected", () => {
    const onChange = vi.fn();

    render(
      <LabelPickerChip
        value={dayOption}
        options={[dayOption, skillOption]}
        level="DAY"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "MAIN" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Clear selection" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("renders mini chip previews for each option inside the menu", () => {
    render(
      <LabelPickerChip
        value={null}
        options={[dayOption, skillOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "—" }));

    const menu = screen.getByRole("menu");
    const previewChips = menu.querySelectorAll(".MuiChip-root.MuiChip-sizeSmall");

    expect(previewChips).toHaveLength(2);
    expect(within(menu).getByText("MAIN")).toBeInTheDocument();
    expect(within(menu).getByText("SKILL")).toBeInTheDocument();
  });

  it("renders the rest preview with the primary tonal variant inside the menu", () => {
    render(
      <LabelPickerChip
        value={null}
        options={[dayOption, restOption]}
        level="DAY"
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "—" }));

    const restMenuItem = screen.getByRole("menuitem", { name: "REST DAY" });
    const restChip = restMenuItem.querySelector(".MuiChip-root");

    expect(restChip).not.toBeNull();
    expect(restChip).toHaveClass("MuiChip-colorPrimary");
  });

  it("does not open the menu when disabled", () => {
    const { container } = render(
      <LabelPickerChip
        value={dayOption}
        options={[dayOption, restOption]}
        level="DAY"
        disabled
        onChange={vi.fn()}
      />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("MuiChip-clickable");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not open the menu when isLoading", () => {
    const { container } = render(
      <LabelPickerChip
        value={null}
        options={[dayOption, restOption]}
        level="DAY"
        isLoading
        onChange={vi.fn()}
      />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("MuiChip-clickable");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not open the menu when options are empty", () => {
    const { container } = render(
      <LabelPickerChip value={null} options={[]} level="DAY" onChange={vi.fn()} />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("MuiChip-clickable");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
