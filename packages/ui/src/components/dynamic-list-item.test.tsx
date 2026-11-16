import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { DynamicListItem } from "./dynamic-list-item";

const ITEM_LABEL = "FAQ item 2";

describe("DynamicListItem controls", () => {
  it("names the remove control after its row and invokes its handler", () => {
    const onRemove = vi.fn();

    render(
      <DynamicListItem itemLabel={ITEM_LABEL} onRemove={onRemove}>
        Row content
      </DynamicListItem>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove FAQ item 2" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /^Move / })).not.toBeInTheDocument();
  });

  it("names the move controls after their row and invokes the matching handlers", () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <DynamicListItem itemLabel={ITEM_LABEL} onMoveUp={onMoveUp} onMoveDown={onMoveDown}>
        Row content
      </DynamicListItem>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Move FAQ item 2 up" }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Move FAQ item 2 down" }));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
  });

  it.each(["up", "down"])("keeps an unavailable move %s focusable and inert", (direction) => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <DynamicListItem
        itemLabel={ITEM_LABEL}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={direction !== "up"}
        canMoveDown={direction !== "down"}
      >
        Row content
      </DynamicListItem>,
    );
    const button = screen.getByRole("button", { name: `Move ${ITEM_LABEL} ${direction}` });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("disabled");
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).not.toHaveBeenCalled();
  });

  it("keeps both moves unavailable for a single row", () => {
    render(
      <DynamicListItem
        itemLabel={ITEM_LABEL}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        canMoveUp={false}
        canMoveDown={false}
      >
        Row content
      </DynamicListItem>,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toHaveAttribute("disabled");
    }
  });
});

describe("DynamicListItem without controls", () => {
  it("renders the bare frame and its content when no handlers are supplied", () => {
    const { container } = render(
      <DynamicListItem itemLabel={ITEM_LABEL}>Row content</DynamicListItem>,
    );

    expect(screen.getByText("Row content")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector(".MuiPaper-root")).toBeInTheDocument();
    expect(container.querySelector(".MuiPaper-root > .MuiStack-root")?.children).toHaveLength(1);
  });

  it("renders no move control when only one move handler is supplied", () => {
    const { rerender } = render(
      <DynamicListItem itemLabel={ITEM_LABEL} onMoveUp={vi.fn()}>
        Row content
      </DynamicListItem>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <DynamicListItem itemLabel={ITEM_LABEL} onMoveDown={vi.fn()}>
        Row content
      </DynamicListItem>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
