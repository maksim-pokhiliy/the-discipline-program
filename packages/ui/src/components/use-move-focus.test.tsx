import { type ReactElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { useMoveFocus } from "./use-move-focus";

type FocusRowProps = { label: string; onMove: () => void };

const FocusRow = ({ label, onMove }: FocusRowProps): ReactElement => {
  const { moveUpRef, moveDownRef, moveKeepingFocus } = useMoveFocus();

  return (
    <div>
      <button ref={moveUpRef} onClick={() => moveKeepingFocus("up", onMove)}>
        Move {label} up
      </button>
      <button ref={moveDownRef} onClick={() => moveKeepingFocus("down", onMove)}>
        Move {label} down
      </button>
    </div>
  );
};

describe("useMoveFocus", () => {
  it.each(["up", "down"])(
    "restores the moved row's %s control when focus is lost before reorder",
    (direction) => {
      const onMove = () => {
        expect(button).toHaveFocus();
        button.blur();
        expect(button).not.toHaveFocus();
        rerender(
          <>
            <FocusRow key="b" label="B" onMove={onMove} />
            <FocusRow key="a" label="A" onMove={onMove} />
          </>,
        );
      };
      const { rerender } = render(
        <>
          <FocusRow key="a" label="A" onMove={onMove} />
          <FocusRow key="b" label="B" onMove={onMove} />
        </>,
      );
      const label = direction === "up" ? "B" : "A";
      const button = screen.getByRole("button", { name: `Move ${label} ${direction}` });

      button.focus();
      fireEvent.click(button);

      expect(screen.getByRole("button", { name: `Move ${label} ${direction}` })).toBe(button);
      expect(button).toHaveFocus();
    },
  );

  it("leaves focus alone on a render without a move", () => {
    const { rerender } = render(<FocusRow label="A" onMove={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Move A up" });

    button.focus();
    rerender(<FocusRow label="A" onMove={vi.fn()} />);

    expect(button).toHaveFocus();
  });
});
