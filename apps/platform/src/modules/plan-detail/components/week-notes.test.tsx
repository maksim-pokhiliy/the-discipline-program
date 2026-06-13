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

const renderNotes = (notes: string[] | null) => {
  mutate.mockClear();

  return render(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes={notes} />);
};

const getNoteInputs = (): (HTMLInputElement | HTMLTextAreaElement)[] =>
  screen
    .queryAllByRole("textbox", { name: /^Week notes/ })
    .filter(
      (el): el is HTMLInputElement | HTMLTextAreaElement =>
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

const fieldRoot = (container: HTMLElement): HTMLElement => {
  const root = container.querySelector(".MuiStack-root > .MuiBox-root");

  if (!(root instanceof HTMLElement)) {
    throw new Error("expected the NotesListField root");
  }

  return root;
};

const blurAway = (root: HTMLElement): void => {
  fireEvent.blur(root, { relatedTarget: document.body });
};

describe("WeekNotes", () => {
  it("fires updateNotes.mutate with the trimmed single note on focus-leave (MT-10)", () => {
    const { container } = renderNotes(null);

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, {
      target: { value: "  light squat day  " },
    });
    blurAway(fieldRoot(container));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: ["light squat day"] },
    });
  });

  it("persists every note in a multi-note list without collapsing (W4R-005)", () => {
    const { container } = renderNotes(null);

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "squat focus" } });
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[1] as HTMLElement, { target: { value: "then conditioning" } });
    blurAway(fieldRoot(container));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: ["squat focus", "then conditioning"] },
    });
  });

  it("reopens a stored multi-note list as separate rows (no collapse on read)", () => {
    renderNotes(["deload week", "RPE caps everywhere"]);

    const inputs = getNoteInputs();

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.value).toBe("deload week");
    expect(inputs[1]?.value).toBe("RPE caps everywhere");
  });

  it("preserves the in-progress draft when the notes prop changes while focused (MT-11)", () => {
    const { container, rerender } = render(
      <WeekNotes planId={PLAN_ID} monday={MONDAY} notes={["initial"]} />,
    );

    fireEvent.focus(fieldRoot(container));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "user draft" } });

    rerender(<WeekNotes planId={PLAN_ID} monday={MONDAY} notes={["background refetch"]} />);

    expect(getNoteInputs()[0]?.value).toBe("user draft");
  });

  it("commits null instead of an empty list when the only note is cleared (MT-12)", () => {
    const { container } = renderNotes(["previous notes"]);

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "" } });
    blurAway(fieldRoot(container));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: null },
    });
  });

  it("preserves embedded newlines within a single note (MT-13)", () => {
    const { container } = renderNotes(null);
    const pasted = "first line\nsecond line\nthird line";

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: pasted } });
    blurAway(fieldRoot(container));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      startDate: formatDateParam(MONDAY),
      data: { notes: [pasted] },
    });
  });
});
