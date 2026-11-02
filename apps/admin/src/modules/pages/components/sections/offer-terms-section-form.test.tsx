import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clickButton, nthButton, typeInto, typeIntoNth } from "@app/test/interactions";

import { LAST_ROW_INDEX, makeTermsBlock } from "../../list-editor.fixtures";
import { makeSectionRow, renderSectionEditor } from "../../pages.fixtures";

describe("OfferTermsSectionForm", () => {
  it("starts without rows on an empty section", () => {
    renderSectionEditor(makeSectionRow("offer:terms", {}));

    expect(screen.getByText("Terms Blocks (0)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Heading")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Body")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Terms Block" })).toBeEnabled();
  });

  it("adds, moves and removes rows and saves them in their new order", async () => {
    const onSave = vi.fn();
    const title = "Fixture terms title";
    const first = makeTermsBlock("First");
    const second = makeTermsBlock("Second");
    const third = makeTermsBlock("Third");

    renderSectionEditor(makeSectionRow("offer:terms", {}), onSave);

    typeInto("Section Title", title);
    [first, second, third].forEach((block, index) => {
      clickButton("Add Terms Block");
      typeIntoNth("Heading", index, block.heading);
      typeIntoNth("Body", index, block.body);
    });
    fireEvent.click(nthButton("Move up", 1));
    fireEvent.click(nthButton("Remove item", LAST_ROW_INDEX));
    expect(screen.getByText("Terms Blocks (2)")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Body").map((input) => input.tagName)).toEqual([
      "TEXTAREA",
      "TEXTAREA",
    ]);
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "offer:terms",
        data: { title, blocks: [second, first] },
      }),
    );
  });

  it("disables move up on the first row and move down on the last row", () => {
    const blocks = [makeTermsBlock("First"), makeTermsBlock("Second"), makeTermsBlock("Third")];

    renderSectionEditor(makeSectionRow("offer:terms", { title: "Fixture title", blocks }));

    expect(nthButton("Move up", 0)).toBeDisabled();
    expect(nthButton("Move down", 0)).toBeEnabled();
    expect(nthButton("Move up", 1)).toBeEnabled();
    expect(nthButton("Move down", 1)).toBeEnabled();
    expect(nthButton("Move up", LAST_ROW_INDEX)).toBeEnabled();
    expect(nthButton("Move down", LAST_ROW_INDEX)).toBeDisabled();
  });
});
