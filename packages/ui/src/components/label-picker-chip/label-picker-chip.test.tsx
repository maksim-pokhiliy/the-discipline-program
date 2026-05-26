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

  it("applies maxWidth and ellipsis styling on the chip label for long label names (QA-005)", () => {
    const longLabel = buildLabel({ id: "long-1", name: "A".repeat(200) });
    const { container } = render(
      <LabelPickerChip value={longLabel} options={[longLabel]} level="DAY" onChange={vi.fn()} />,
    );
    const chipRoot = container.querySelector(".MuiChip-root");
    const chipLabel = container.querySelector(".MuiChip-label");

    expect(chipRoot).not.toBeNull();
    expect(chipLabel).not.toBeNull();
    expect(chipRoot).toHaveStyle({ maxWidth: "320px" });
    expect(chipLabel).toHaveStyle({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
  });
});

describe("LabelPickerChip multi-mode", () => {
  it("renders only the +label trigger when value is empty", () => {
    render(
      <LabelPickerChip
        multiple
        value={[]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByLabelText("Add block label");

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("+ label");
  });

  it("renders one chip per selected label plus the +label trigger when partial", () => {
    const { container } = render(
      <LabelPickerChip
        multiple
        value={[dayOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("MAIN")).toBeInTheDocument();
    expect(screen.getByLabelText("Add block label")).toBeInTheDocument();

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips).toHaveLength(1);
  });

  it("opens menu listing only unselected options when trigger is clicked", () => {
    render(
      <LabelPickerChip
        multiple
        value={[dayOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Add block label"));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");

    expect(items).toHaveLength(1);
    expect(within(menu).getByText("SKILL")).toBeInTheDocument();
  });

  it("fires onChange with appended ids when a menu option is selected", () => {
    const onChange = vi.fn();

    render(
      <LabelPickerChip
        multiple
        value={[dayOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Add block label"));
    fireEvent.click(screen.getByRole("menuitem", { name: "SKILL" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["day-1", "day-3"]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("fires onChange with filtered ids when a chip onDelete is clicked", () => {
    const onChange = vi.fn();
    const { container } = render(
      <LabelPickerChip
        multiple
        value={[dayOption, skillOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={onChange}
      />,
    );

    const firstDeleteIcon = container.querySelector(".MuiChip-deleteIcon");

    expect(firstDeleteIcon).not.toBeNull();

    if (firstDeleteIcon === null) {
      throw new Error("first deleteIcon node missing");
    }

    fireEvent.click(firstDeleteIcon);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["day-3"]);
  });

  it("surfaces 'All labels added.' inside the menu when every option is already selected (QA-002)", () => {
    render(
      <LabelPickerChip
        multiple
        value={[dayOption, skillOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByLabelText("Add block label");

    expect(trigger).toHaveTextContent("+ label");
    expect(trigger).not.toHaveClass("Mui-disabled");

    fireEvent.click(trigger);

    const menu = screen.getByRole("menu");

    expect(within(menu).getByText("All labels added.")).toBeInTheDocument();
    expect(within(menu).queryAllByRole("menuitem", { name: /MAIN|SKILL/ })).toHaveLength(0);
  });

  it("surfaces 'No labels available.' inside the menu when the option pool is empty (QA-001)", () => {
    render(<LabelPickerChip multiple value={[]} options={[]} level="BLOCK" onChange={vi.fn()} />);

    const trigger = screen.getByLabelText("Add block label");

    expect(trigger).toHaveTextContent("+ label");

    fireEvent.click(trigger);

    const menu = screen.getByRole("menu");

    expect(within(menu).getByText("No labels available.")).toBeInTheDocument();
    expect(within(menu).queryByText("All labels added.")).toBeNull();
  });

  it("applies maxWidth and ellipsis styling on multi-mode chips for long label names (QA-003)", () => {
    const longLabel = buildLabel({ id: "long-1", name: "A".repeat(200) });
    const { container } = render(
      <LabelPickerChip
        multiple
        value={[longLabel]}
        options={[longLabel]}
        level="BLOCK"
        onChange={vi.fn()}
      />,
    );
    const chipRoot = container.querySelector(".MuiChip-root");
    const chipLabel = container.querySelector(".MuiChip-label");

    expect(chipRoot).not.toBeNull();
    expect(chipLabel).not.toBeNull();
    expect(chipRoot).toHaveStyle({ maxWidth: "320px" });
    expect(chipLabel).toHaveStyle({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
  });

  it("renders MAX_LABELS_PER_BLOCK chips with the trigger surfacing 'All labels added.' (QA-Gap-K)", () => {
    const labels = Array.from({ length: 10 }, (_, index) =>
      buildLabel({ id: `lab-${String(index)}`, name: `LABEL_${String(index)}` }),
    );
    const { container } = render(
      <LabelPickerChip multiple value={labels} options={labels} level="BLOCK" onChange={vi.fn()} />,
    );

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips).toHaveLength(10);

    const trigger = screen.getByLabelText("Add block label");

    fireEvent.click(trigger);

    const menu = screen.getByRole("menu");

    expect(within(menu).getByText("All labels added.")).toBeInTheDocument();
  });

  it("filters duplicate ids out of the menu and does not fire onChange when adding an already-present label (QA-009)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <LabelPickerChip
        multiple
        value={[dayOption, dayOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        onChange={onChange}
      />,
    );

    const chips = container.querySelectorAll(".MuiChip-root");

    expect(chips).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("Add block label"));

    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");

    expect(items).toHaveLength(1);
    expect(within(menu).queryByText("MAIN")).toBeNull();
    expect(within(menu).getByText("SKILL")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not render onDelete on chips when disabled", () => {
    const { container } = render(
      <LabelPickerChip
        multiple
        value={[dayOption, skillOption]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        disabled
        onChange={vi.fn()}
      />,
    );

    const deleteIcons = container.querySelectorAll(".MuiChip-deleteIcon");

    expect(deleteIcons).toHaveLength(0);
  });

  it("replaces the trigger with a spinner and loading copy when isLoading", () => {
    render(
      <LabelPickerChip
        multiple
        value={[]}
        options={[dayOption, skillOption]}
        level="BLOCK"
        isLoading
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Add block label")).toBeNull();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
