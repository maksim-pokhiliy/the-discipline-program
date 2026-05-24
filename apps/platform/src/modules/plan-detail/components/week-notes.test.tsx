import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { formatDateParam } from "@repo/shared";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const mutate = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateWeekNotes: () => ({ mutate }),
  };
});

const { WeekNotes } = await import("./week-notes");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const MONDAY = new Date(2026, 4, 4);

const renderNotes = (notes: string | null) =>
  render(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes={notes} />);

const getNotesInput = (): HTMLInputElement | HTMLTextAreaElement => {
  const el = screen.getByRole("textbox", { name: "Week notes" });

  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
    throw new Error("expected an input/textarea element for Week notes");
  }

  return el;
};

describe("WeekNotes", () => {
  it("fires updateNotes.mutate with the trimmed draft on blur (MT-10)", () => {
    mutate.mockClear();
    renderNotes(null);

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  light squat day  " } });
    fireEvent.blur(input);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: "light squat day" },
    });
  });

  it("preserves the in-progress draft when the notes prop changes while focused (MT-11)", () => {
    mutate.mockClear();
    const { rerender } = render(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes="initial" />);
    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "user draft" } });

    rerender(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes="background refetch" />);

    expect(input.value).toBe("user draft");

    fireEvent.blur(input);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: "user draft" },
    });
  });

  it("commits null instead of an empty string when blur happens on a cleared field (MT-12)", () => {
    mutate.mockClear();
    renderNotes("previous notes");

    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: null },
    });
  });

  it("preserves embedded newlines through blur-commit (MT-13)", () => {
    mutate.mockClear();
    renderNotes(null);

    const input = getNotesInput();
    const pasted = "first line\nsecond line\nthird line";

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: pasted } });
    fireEvent.blur(input);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: pasted },
    });
  });

  it("does not discard the focused draft when the notes prop changes mid-edit (MT-16)", () => {
    mutate.mockClear();
    const { rerender } = render(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes={null} />);
    const input = getNotesInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "coach typing" } });

    rerender(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes="server returned this" />);

    expect(input.value).toBe("coach typing");

    rerender(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes="another sibling write" />);

    expect(input.value).toBe("coach typing");
  });
});
