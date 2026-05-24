import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  describe("chrome", () => {
    it("renders a Card chrome surface with the outlined variant", () => {
      const { container } = render(<PageHeader title="Plan A" />);
      const card = container.querySelector(".MuiCard-root");

      expect(card).not.toBeNull();
      expect(card).toHaveClass("MuiPaper-outlined");
    });

    it("renders the title with h1 typography in display mode", () => {
      const { container } = render(<PageHeader title="Plan A" />);
      const title = container.querySelector("h1");

      expect(title).not.toBeNull();
      expect(title).toHaveClass("MuiTypography-h1");
      expect(title).toHaveTextContent("Plan A");
    });

    it("renders the meta slot when provided", () => {
      render(<PageHeader title="Plan A" meta={<span data-testid="meta-row">42 athletes</span>} />);

      expect(screen.getByTestId("meta-row")).toBeInTheDocument();
    });

    it("omits the meta slot when not provided", () => {
      render(<PageHeader title="Plan A" />);

      expect(screen.queryByTestId("meta-row")).toBeNull();
    });
  });

  describe("display mode", () => {
    it("renders the title as static text when editable is false", () => {
      render(<PageHeader title="Plan A" />);

      expect(screen.getByText("Plan A")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("renders the description as static text when provided in display mode", () => {
      render(<PageHeader title="Plan A" description="Weekly strength block" />);

      expect(screen.getByText("Weekly strength block")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("renders a back link when backHref is provided", () => {
      render(<PageHeader title="Plan A" backHref="/coach/plans" />);

      const backLink = screen.getByRole("link", { name: "Go back" });

      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute("href", "/coach/plans");
    });

    it("renders provided actions", () => {
      render(
        <PageHeader title="Plan A" actions={<span data-testid="header-action">Action</span>} />,
      );

      expect(screen.getByTestId("header-action")).toBeInTheDocument();
    });
  });

  describe("editable mode", () => {
    it("renders title and description as editable inputs", () => {
      render(
        <PageHeader
          editable
          title="Plan A"
          description="Weekly strength block"
          onTitleCommit={vi.fn()}
          onDescriptionCommit={vi.fn()}
        />,
      );

      expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Plan A");
      expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
        "Weekly strength block",
      );
    });

    it("commits the trimmed title on blur", () => {
      const onTitleCommit = vi.fn();

      render(<PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />);
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "  Plan B  " } });
      fireEvent.blur(input);

      expect(onTitleCommit).toHaveBeenCalledTimes(1);
      expect(onTitleCommit).toHaveBeenCalledWith("Plan B");
    });

    it("commits the title on Enter when single-line", () => {
      const onTitleCommit = vi.fn();

      render(<PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />);
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Plan B" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onTitleCommit).toHaveBeenCalledTimes(1);
      expect(onTitleCommit).toHaveBeenCalledWith("Plan B");
    });

    it("reverts the title to the original on Escape without committing", () => {
      const onTitleCommit = vi.fn();

      render(<PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />);
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Plan B" } });
      fireEvent.keyDown(input, { key: "Escape" });

      expect(onTitleCommit).not.toHaveBeenCalled();
      expect(input).toHaveValue("Plan A");
    });

    it("reverts to the original when the title is emptied (emptyIsValid=false)", () => {
      const onTitleCommit = vi.fn();

      render(<PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />);
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.blur(input);

      expect(onTitleCommit).not.toHaveBeenCalled();
      expect(input).toHaveValue("Plan A");
    });

    it("commits an empty description (emptyIsValid=true)", () => {
      const onDescriptionCommit = vi.fn();

      render(
        <PageHeader
          editable
          title="Plan A"
          description="Initial"
          onDescriptionCommit={onDescriptionCommit}
        />,
      );
      const input = screen.getByRole("textbox", { name: "Description" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);

      expect(onDescriptionCommit).toHaveBeenCalledTimes(1);
      expect(onDescriptionCommit).toHaveBeenCalledWith("");
    });

    it("does not commit description on Enter when multiline", () => {
      const onDescriptionCommit = vi.fn();

      render(
        <PageHeader
          editable
          title="Plan A"
          description="Initial"
          onDescriptionCommit={onDescriptionCommit}
        />,
      );
      const input = screen.getByRole("textbox", { name: "Description" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Updated" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onDescriptionCommit).not.toHaveBeenCalled();
    });

    it("does not commit when the value is unchanged", () => {
      const onTitleCommit = vi.fn();

      render(<PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />);
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onTitleCommit).not.toHaveBeenCalled();
    });

    it("keeps an in-progress draft when the title prop changes while focused", () => {
      const onTitleCommit = vi.fn();

      const { rerender } = render(
        <PageHeader editable title="Plan A" onTitleCommit={onTitleCommit} />,
      );
      const input = screen.getByRole("textbox", { name: "Title" });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "User draft" } });

      rerender(<PageHeader editable title="Background refetch" onTitleCommit={onTitleCommit} />);

      fireEvent.blur(input);

      expect(onTitleCommit).toHaveBeenCalledTimes(1);
      expect(onTitleCommit).toHaveBeenCalledWith("User draft");
    });
  });
});
