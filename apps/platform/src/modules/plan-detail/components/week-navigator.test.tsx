import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { addDays, DAYS_IN_WEEK, formatDateParam, getMonday } from "@repo/shared";

import { render } from "@app/test/render";

type DatePickerProps = {
  value: Date | null;
  onChange: (next: Date | null) => void;
};

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ value, onChange }: DatePickerProps) => (
    <input
      data-testid="datepicker"
      data-value={value ? value.toISOString() : ""}
      onChange={(event) => {
        const raw = event.target.value;

        if (raw === "INVALID") {
          onChange(new Date("invalid"));

          return;
        }

        if (raw === "NULL") {
          onChange(null);

          return;
        }

        onChange(new Date(raw));
      }}
    />
  ),
}));

const { WeekNavigator } = await import("./week-navigator");

const firstCallArg = (spy: ReturnType<typeof vi.fn>, index: number): Date => {
  const call = spy.mock.calls[index];

  if (!call) {
    throw new Error(`Expected spy to have been called at index ${String(index)}`);
  }

  const arg = call[0];

  if (!(arg instanceof Date)) {
    throw new Error(`Expected first argument to be a Date, got ${String(arg)}`);
  }

  return arg;
};

describe("WeekNavigator", () => {
  it("calls onChange with the current monday plus a week when next is clicked (MT-05)", () => {
    const onChange = vi.fn();
    const firstMonday = new Date(2026, 4, 4);

    const { rerender } = render(<WeekNavigator monday={firstMonday} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(formatDateParam(firstCallArg(onChange, 0))).toBe(
      formatDateParam(addDays(firstMonday, DAYS_IN_WEEK)),
    );

    const secondMonday = new Date(2026, 5, 1);

    rerender(<WeekNavigator monday={secondMonday} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(formatDateParam(firstCallArg(onChange, 1))).toBe(
      formatDateParam(addDays(secondMonday, DAYS_IN_WEEK)),
    );
  });

  it("calls onChange with the current monday minus a week when previous is clicked (MT-05)", () => {
    const onChange = vi.fn();
    const firstMonday = new Date(2026, 4, 4);

    const { rerender } = render(<WeekNavigator monday={firstMonday} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(formatDateParam(firstCallArg(onChange, 0))).toBe(
      formatDateParam(addDays(firstMonday, -DAYS_IN_WEEK)),
    );

    const secondMonday = new Date(2026, 5, 1);

    rerender(<WeekNavigator monday={secondMonday} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(formatDateParam(firstCallArg(onChange, 1))).toBe(
      formatDateParam(addDays(secondMonday, -DAYS_IN_WEEK)),
    );
  });

  it("ignores DatePicker null change (MT-07)", () => {
    const onChange = vi.fn();
    const monday = new Date(2026, 4, 4);

    render(<WeekNavigator monday={monday} onChange={onChange} />);

    fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "NULL" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores DatePicker Invalid Date change (MT-07)", () => {
    const onChange = vi.fn();
    const monday = new Date(2026, 4, 4);

    render(<WeekNavigator monday={monday} onChange={onChange} />);

    fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "INVALID" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("normalizes a valid DatePicker date via getMonday before calling onChange (MT-08)", () => {
    const onChange = vi.fn();
    const monday = new Date(2026, 4, 4);
    const pickedWednesday = new Date(2026, 4, 6);

    render(<WeekNavigator monday={monday} onChange={onChange} />);

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: pickedWednesday.toISOString() },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(formatDateParam(firstCallArg(onChange, 0))).toBe(
      formatDateParam(getMonday(pickedWednesday)),
    );
  });

  it("flips the Today button color to inherit when monday is the current week (MT-09)", () => {
    const onChange = vi.fn();
    const todayMonday = getMonday(new Date());

    render(<WeekNavigator monday={todayMonday} onChange={onChange} />);
    const todayButton = screen.getByRole("button", { name: /Today/ });

    expect(todayButton).toHaveClass("MuiButton-outlinedInherit");
  });

  it("flips the Today button color to primary when monday is a different week (MT-09)", () => {
    const onChange = vi.fn();
    const nextWeekMonday = addDays(getMonday(new Date()), DAYS_IN_WEEK);

    render(<WeekNavigator monday={nextWeekMonday} onChange={onChange} />);
    const todayButton = screen.getByRole("button", { name: /Today/ });

    expect(todayButton).toHaveClass("MuiButton-outlinedPrimary");
    expect(todayButton).not.toHaveClass("MuiButton-outlinedInherit");
  });

  it("renders the clone trigger beside the arrows and fires onCloneWeek when provided", () => {
    const onChange = vi.fn();
    const onCloneWeek = vi.fn();
    const monday = new Date(2026, 4, 4);

    render(<WeekNavigator monday={monday} onChange={onChange} onCloneWeek={onCloneWeek} />);

    fireEvent.click(screen.getByRole("button", { name: "Clone into this week" }));

    expect(onCloneWeek).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders no clone trigger when onCloneWeek is omitted", () => {
    const onChange = vi.fn();
    const monday = new Date(2026, 4, 4);

    render(<WeekNavigator monday={monday} onChange={onChange} />);

    expect(screen.queryByRole("button", { name: "Clone into this week" })).toBeNull();
  });
});
