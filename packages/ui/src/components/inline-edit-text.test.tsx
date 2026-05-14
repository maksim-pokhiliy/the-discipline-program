import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { InlineEditText } from "./inline-edit-text";

describe("InlineEditText", () => {
  it("renders the value in an always-present editable textbox", () => {
    render(<InlineEditText value="Hello" onCommit={vi.fn()} variant="h3" ariaLabel="Field" />);

    expect(screen.getByRole("textbox", { name: "Field" })).toHaveValue("Hello");
  });

  it("commits a trimmed changed value on blur", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  Updated  " } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Updated");
  });

  it("commits on Enter when not multiline", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Updated");
  });

  it("reverts the draft on Escape without committing", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("Hello");
  });

  it("does not commit when the value is unchanged", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps the in-progress draft when the value prop changes while focused", () => {
    const onCommit = vi.fn();

    const { rerender } = render(
      <InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />,
    );
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "User draft" } });

    rerender(
      <InlineEditText
        value="Background refetch"
        onCommit={onCommit}
        variant="h3"
        ariaLabel="Field"
      />,
    );

    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("User draft");
  });

  it("does not commit on Enter when multiline", () => {
    const onCommit = vi.fn();

    render(
      <InlineEditText
        value="Hello"
        onCommit={onCommit}
        variant="body2"
        ariaLabel="Field"
        multiline
      />,
    );
    const input = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("handles an emptied field per emptyIsValid", () => {
    const strictOnCommit = vi.fn();
    const { unmount } = render(
      <InlineEditText value="Hello" onCommit={strictOnCommit} variant="h3" ariaLabel="Field" />,
    );
    const strictInput = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(strictInput);
    fireEvent.change(strictInput, { target: { value: "  " } });
    fireEvent.blur(strictInput);

    expect(strictOnCommit).not.toHaveBeenCalled();
    expect(strictInput).toHaveValue("Hello");

    unmount();

    const lenientOnCommit = vi.fn();

    render(
      <InlineEditText
        value="Hello"
        onCommit={lenientOnCommit}
        variant="body2"
        ariaLabel="Field"
        emptyIsValid
      />,
    );
    const lenientInput = screen.getByRole("textbox", { name: "Field" });

    fireEvent.focus(lenientInput);
    fireEvent.change(lenientInput, { target: { value: "" } });
    fireEvent.blur(lenientInput);

    expect(lenientOnCommit).toHaveBeenCalledTimes(1);
    expect(lenientOnCommit).toHaveBeenCalledWith("");
  });
});
