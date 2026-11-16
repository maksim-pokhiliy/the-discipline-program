import { type ReactElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const blurMovedControl = (node: Node): void => {
  const active = document.activeElement;

  if (node.parentNode !== null && active instanceof HTMLElement && node.contains(active)) {
    active.blur();
  }
};

beforeEach(() => {
  const insertBefore = Node.prototype.insertBefore;
  const appendChild = Node.prototype.appendChild;

  vi.spyOn(Node.prototype, "insertBefore").mockImplementation(function (this: Node, node, child) {
    blurMovedControl(node);

    return insertBefore.call(this, node, child);
  });
  vi.spyOn(Node.prototype, "appendChild").mockImplementation(function (this: Node, node) {
    blurMovedControl(node);

    return appendChild.call(this, node);
  });
});

afterEach(() => vi.restoreAllMocks());

describe("useMoveFocus", () => {
  it.each(["up", "down"])(
    "restores the moved row's %s control after browser focus fixup",
    (direction) => {
      const onMove = () => {
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
