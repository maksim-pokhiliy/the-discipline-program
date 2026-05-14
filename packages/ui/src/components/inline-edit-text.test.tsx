import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { InlineEditText } from "./inline-edit-text";

describe("InlineEditText", () => {
  it("toggles from display to edit mode on click", () => {
    render(<InlineEditText value="Hello" onCommit={vi.fn()} variant="h3" ariaLabel="Field" />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Field" }));

    expect(screen.getByRole("textbox", { name: "Field" })).toBeInTheDocument();
  });

  it("commits a changed value on blur", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "  Updated  " } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Updated");
  });

  it("commits a changed value on Enter when not multiline", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Updated");
  });

  it("reverts on Escape without committing", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Field" })).toHaveTextContent("Hello");
  });

  it("does not commit when the value is unchanged", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />);

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    fireEvent.blur(screen.getByRole("textbox"));

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the in-progress draft when the value prop changes mid-edit", () => {
    const onCommit = vi.fn();

    const { rerender } = render(
      <InlineEditText value="Hello" onCommit={onCommit} variant="h3" ariaLabel="Field" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "User draft" } });

    rerender(
      <InlineEditText
        value="Background refetch"
        onCommit={onCommit}
        variant="h3"
        ariaLabel="Field"
      />,
    );

    fireEvent.blur(screen.getByRole("textbox"));

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

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("preserves line breaks in multiline display mode", () => {
    render(
      <InlineEditText
        value={"line one\nline two"}
        onCommit={vi.fn()}
        variant="body2"
        ariaLabel="Field"
        multiline
      />,
    );

    expect(screen.getByRole("button", { name: "Field" })).toHaveStyle({
      whiteSpace: "pre-wrap",
    });
  });

  it("handles an emptied field per emptyIsValid", () => {
    const strictOnCommit = vi.fn();
    const { unmount } = render(
      <InlineEditText value="Hello" onCommit={strictOnCommit} variant="h3" ariaLabel="Field" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const strictInput = screen.getByRole("textbox");

    fireEvent.change(strictInput, { target: { value: "  " } });
    fireEvent.blur(strictInput);

    expect(strictOnCommit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Field" })).toHaveTextContent("Hello");

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

    fireEvent.click(screen.getByRole("button", { name: "Field" }));
    const lenientInput = screen.getByRole("textbox");

    fireEvent.change(lenientInput, { target: { value: "" } });
    fireEvent.blur(lenientInput);

    expect(lenientOnCommit).toHaveBeenCalledTimes(1);
    expect(lenientOnCommit).toHaveBeenCalledWith("");
  });
});
