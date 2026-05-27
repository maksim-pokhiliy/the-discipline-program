import { createElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import type { SelectedArchetype } from "./schema-editor-types";

const archetypePickerSelectRef: { current: ((selected: SelectedArchetype) => void) | null } = {
  current: null,
};

vi.mock("./archetype-picker", () => {
  const renderPickerMock = (props: {
    open: boolean;
    onClose: () => void;
    onSelect: (selected: SelectedArchetype) => void;
  }) => {
    archetypePickerSelectRef.current = props.onSelect;

    return props.open
      ? createElement(
          "div",
          {
            "data-testid": "archetype-picker-mock",
            "data-open": String(props.open),
          },
          createElement(
            "button",
            { type: "button", onClick: props.onClose, "data-testid": "archetype-picker-close" },
            "close",
          ),
        )
      : null;
  };

  return { ArchetypePicker: renderPickerMock };
});

vi.mock("./schema-editor-modal", () => {
  const renderEditorMock = (props: { open: boolean }) =>
    props.open
      ? createElement("div", {
          "data-testid": "schema-editor-modal-mock",
          "data-open": String(props.open),
        })
      : null;

  return { SchemaEditorModal: renderEditorMock };
});

const { AddSchemaButton } = await import("./add-schema-button");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";

const renderAddSchemaButton = () =>
  render(<AddSchemaButton planId={PLAN_ID} startDate={START_DATE} blockId={BLOCK_ID} />);

describe("AddSchemaButton", () => {
  it("renders the PlusRowButton with the 'Add schema' label and enabled by default", () => {
    renderAddSchemaButton();

    const button = screen.getByRole("button", { name: /Add schema/i });

    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("opens the ArchetypePicker when the PlusRowButton trigger is clicked", () => {
    renderAddSchemaButton();

    expect(screen.queryByTestId("archetype-picker-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Add schema/i }));

    expect(screen.getByTestId("archetype-picker-mock")).toBeInTheDocument();
  });

  it("disables the trigger PlusRowButton while the ArchetypePicker is open (QA-C7-02, QA-Must-C7-4)", () => {
    renderAddSchemaButton();

    const button = screen.getByRole("button", { name: /Add schema/i });

    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  it("re-enables the trigger PlusRowButton when the ArchetypePicker is closed without selection", () => {
    renderAddSchemaButton();

    const button = screen.getByRole("button", { name: /Add schema/i });

    fireEvent.click(button);
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByTestId("archetype-picker-close"));

    expect(button).not.toBeDisabled();
  });

  it("keeps the trigger PlusRowButton disabled while a pendingArchetype awaits the editor (QA-C7-02)", () => {
    renderAddSchemaButton();

    const button = screen.getByRole("button", { name: /Add schema/i });

    fireEvent.click(button);

    const onSelect = archetypePickerSelectRef.current;

    if (onSelect === null) {
      throw new Error("expected archetype-picker onSelect to be captured by the mock");
    }

    onSelect({
      archetypeId: "clp9z8x7w0000abcd1234arc1",
      name: "n-rounds",
      kind: "ATOMIC",
    });

    expect(button).toBeDisabled();
  });
});
