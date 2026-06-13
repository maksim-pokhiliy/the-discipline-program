import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { NotesListField } from "./notes-list-field";

const ARIA = "Block notes";

const getNoteInputs = (): (HTMLInputElement | HTMLTextAreaElement)[] =>
  screen
    .queryAllByRole("textbox", { name: new RegExp(`^${ARIA}`) })
    .filter(
      (el): el is HTMLInputElement | HTMLTextAreaElement =>
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    );

const blurAway = (root: HTMLElement): void => {
  fireEvent.blur(root, { relatedTarget: document.body });
};

describe("NotesListField", () => {
  it("seeds the editor rows from a multi-note value (F2 multi-note round-trip)", () => {
    render(
      <NotesListField value={["first cue", "second cue"]} onCommit={vi.fn()} ariaLabel={ARIA} />,
    );

    const inputs = getNoteInputs();

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.value).toBe("first cue");
    expect(inputs[1]?.value).toBe("second cue");
  });

  it("commits the full string[] when focus leaves the field after editing two notes", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <NotesListField value={null} onCommit={onCommit} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("expected the field root element");
    }

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "row one" } });
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[1] as HTMLElement, { target: { value: "row two" } });

    blurAway(root);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(["row one", "row two"]);
  });

  it("commits null when every note is cleared to empty/whitespace on focus-leave", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <NotesListField value={["previous note"]} onCommit={onCommit} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("expected the field root element");
    }

    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "   " } });

    blurAway(root);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(null);
  });

  it("drops empty rows and trims surviving notes on commit", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <NotesListField value={null} onCommit={onCommit} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("expected the field root element");
    }

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "  keep me  " } });
    fireEvent.click(screen.getByRole("button", { name: "add note" }));

    blurAway(root);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(["keep me"]);
  });

  it("does not commit while focus moves between rows inside the field", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <NotesListField value={["a", "b"]} onCommit={onCommit} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;
    const inputs = getNoteInputs();

    if (!(root instanceof HTMLElement) || inputs[1] === undefined) {
      throw new Error("expected the field root and a second input");
    }

    fireEvent.blur(root, { relatedTarget: inputs[1] });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("does not commit when the value is unchanged on focus-leave", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <NotesListField value={["unchanged"]} onCommit={onCommit} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("expected the field root element");
    }

    blurAway(root);

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("preserves the in-progress draft when the value prop changes while focused", () => {
    const { container, rerender } = render(
      <NotesListField value={["initial"]} onCommit={vi.fn()} ariaLabel={ARIA} />,
    );

    const root = container.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("expected the field root element");
    }

    fireEvent.focus(root);
    fireEvent.change(getNoteInputs()[0] as HTMLElement, { target: { value: "user draft" } });

    rerender(<NotesListField value={["background refetch"]} onCommit={vi.fn()} ariaLabel={ARIA} />);

    expect(getNoteInputs()[0]?.value).toBe("user draft");
  });

  it("re-seeds from the value prop when the field is not focused", () => {
    const { rerender } = render(
      <NotesListField value={["one"]} onCommit={vi.fn()} ariaLabel={ARIA} />,
    );

    rerender(<NotesListField value={["one", "two"]} onCommit={vi.fn()} ariaLabel={ARIA} />);

    const inputs = getNoteInputs();

    expect(inputs).toHaveLength(2);
    expect(inputs[1]?.value).toBe("two");
  });
});
