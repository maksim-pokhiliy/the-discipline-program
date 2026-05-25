import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { InlineEditText } from "./inline-edit-text";

describe("InlineEditText", () => {
  it("renders an input with the provided ariaLabel and value", () => {
    render(<InlineEditText value="Plan A" onCommit={vi.fn()} variant="h1" ariaLabel="Title" />);

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Plan A");
  });

  it("renders a placeholder when value is empty", () => {
    render(
      <InlineEditText
        value=""
        onCommit={vi.fn()}
        variant="body1"
        ariaLabel="Description"
        placeholder="Add a description…"
        emptyIsValid
      />,
    );

    expect(screen.getByPlaceholderText("Add a description…")).toBeInTheDocument();
  });

  it("commits the trimmed value on blur", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />);
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  Plan B  " } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Plan B");
  });

  it("reverts to the original on Escape without committing", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />);
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Plan B" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("Plan A");
  });

  it("commits on Enter when single-line", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />);
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Plan B" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Plan B");
  });

  it("does not commit on Enter when multiline", () => {
    const onCommit = vi.fn();

    render(
      <InlineEditText
        value="Initial"
        onCommit={onCommit}
        variant="body1"
        ariaLabel="Description"
        multiline
        emptyIsValid
      />,
    );
    const input = screen.getByRole("textbox", { name: "Description" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("rejects an empty value when emptyIsValid is false", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />);
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("Plan A");
  });

  it("commits an empty value when emptyIsValid is true", () => {
    const onCommit = vi.fn();

    render(
      <InlineEditText
        value="Initial"
        onCommit={onCommit}
        variant="body1"
        ariaLabel="Description"
        emptyIsValid
      />,
    );
    const input = screen.getByRole("textbox", { name: "Description" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("");
  });

  it("does not commit when the value is unchanged", () => {
    const onCommit = vi.fn();

    render(<InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />);
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("preserves the in-progress draft when the controlled value changes while focused", () => {
    const onCommit = vi.fn();

    const { rerender } = render(
      <InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />,
    );
    const input = screen.getByRole("textbox", { name: "Title" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "User draft" } });

    rerender(
      <InlineEditText
        value="Background refetch"
        onCommit={onCommit}
        variant="h1"
        ariaLabel="Title"
      />,
    );

    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("User draft");
  });

  it("syncs the draft to the controlled value when not focused", () => {
    const onCommit = vi.fn();

    const { rerender } = render(
      <InlineEditText value="Plan A" onCommit={onCommit} variant="h1" ariaLabel="Title" />,
    );

    rerender(<InlineEditText value="Plan B" onCommit={onCommit} variant="h1" ariaLabel="Title" />);

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Plan B");
  });

  it("forwards maxLength to the underlying input", () => {
    render(
      <InlineEditText
        value="Initial"
        onCommit={vi.fn()}
        variant="body2"
        ariaLabel="Day notes"
        maxLength={2000}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Day notes" })).toHaveAttribute("maxlength", "2000");
  });
});
