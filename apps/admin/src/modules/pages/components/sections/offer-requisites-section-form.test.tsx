import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clickButton, nthButton, typeInto, typeIntoNth } from "@app/test/interactions";

import { LAST_ROW_INDEX } from "../../list-editor.fixtures";
import { makeSectionRow, renderSectionEditor } from "../../pages.fixtures";

const makeRequisite = (name: string) => ({ label: `${name} label`, value: `${name} value` });

describe("OfferRequisitesSectionForm", () => {
  it("starts without rows on an empty section", () => {
    renderSectionEditor(makeSectionRow("offer:requisites", {}));

    expect(screen.getByText("Requisites (0)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Label")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Value")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Requisite" })).toBeEnabled();
  });

  it("adds, moves and removes rows and saves them in their new order", async () => {
    const onSave = vi.fn();
    const title = "Fixture requisites title";
    const first = makeRequisite("First");
    const second = makeRequisite("Second");
    const third = makeRequisite("Third");

    renderSectionEditor(makeSectionRow("offer:requisites", {}), onSave);

    typeInto("Section Title", title);
    [first, second, third].forEach((item, index) => {
      clickButton("Add Requisite");
      typeIntoNth("Label", index, item.label);
      typeIntoNth("Value", index, item.value);
    });
    fireEvent.click(nthButton("Move up", 1));
    fireEvent.click(nthButton("Remove item", LAST_ROW_INDEX));
    expect(screen.getByText("Requisites (2)")).toBeInTheDocument();
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "offer:requisites",
        data: { title, items: [second, first] },
      }),
    );
  });

  it("disables move up on the first row and move down on the last row", () => {
    const items = [makeRequisite("First"), makeRequisite("Second"), makeRequisite("Third")];

    renderSectionEditor(makeSectionRow("offer:requisites", { title: "Fixture title", items }));

    expect(nthButton("Move up", 0)).toBeDisabled();
    expect(nthButton("Move down", 0)).toBeEnabled();
    expect(nthButton("Move up", 1)).toBeEnabled();
    expect(nthButton("Move down", 1)).toBeEnabled();
    expect(nthButton("Move up", LAST_ROW_INDEX)).toBeEnabled();
    expect(nthButton("Move down", LAST_ROW_INDEX)).toBeDisabled();
  });
});
