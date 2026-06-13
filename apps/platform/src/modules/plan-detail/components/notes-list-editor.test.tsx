import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NOTE_MAX_LENGTH, NOTES_MAX_COUNT } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { NotesListEditor } from "./notes-list-editor";

const ARIA = "Notes";

const getNoteInputs = (): (HTMLInputElement | HTMLTextAreaElement)[] =>
  screen
    .queryAllByRole("textbox", { name: new RegExp(`^${ARIA}`) })
    .filter(
      (el): el is HTMLInputElement | HTMLTextAreaElement =>
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

const onChange = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("NotesListEditor add/remove", () => {
  it("appends an empty string when add is clicked", () => {
    render(<NotesListEditor value={["a"]} onChange={onChange} ariaLabel={ARIA} />);

    fireEvent.click(screen.getByRole("button", { name: "add note" }));

    expect(onChange).toHaveBeenCalledWith(["a", ""]);
  });

  it("removes a note by index", () => {
    render(<NotesListEditor value={["a", "b", "c"]} onChange={onChange} ariaLabel={ARIA} />);

    const removeButtons = screen.getAllByRole("button", { name: "Remove note" });

    fireEvent.click(removeButtons[1] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(["a", "c"]);
  });

  it("emits the edited note at its index", () => {
    render(<NotesListEditor value={["a", "b"]} onChange={onChange} ariaLabel={ARIA} />);

    fireEvent.change(getNoteInputs()[1] as HTMLElement, { target: { value: "updated" } });

    expect(onChange).toHaveBeenCalledWith(["a", "updated"]);
  });
});

describe("NotesListEditor caps", () => {
  it("disables add at the NOTES_MAX_COUNT cap", () => {
    const value = Array.from({ length: NOTES_MAX_COUNT }, (_, index) => `note ${index}`);

    render(<NotesListEditor value={value} onChange={onChange} ariaLabel={ARIA} />);

    expect(screen.getByRole("button", { name: "add note" })).toBeDisabled();
  });

  it("keeps add enabled one below the cap", () => {
    const value = Array.from({ length: NOTES_MAX_COUNT - 1 }, (_, index) => `note ${index}`);

    render(<NotesListEditor value={value} onChange={onChange} ariaLabel={ARIA} />);

    expect(screen.getByRole("button", { name: "add note" })).toBeEnabled();
  });

  it("enforces the per-note maxLength on each input", () => {
    render(<NotesListEditor value={["a"]} onChange={onChange} ariaLabel={ARIA} />);

    expect(getNoteInputs()[0]).toHaveAttribute("maxlength", String(NOTE_MAX_LENGTH));
  });
});
