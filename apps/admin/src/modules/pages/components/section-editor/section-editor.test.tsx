import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SECTION_SCHEMAS } from "@repo/contracts/cms/pages";

import { clickButton, typeInto } from "@app/test/interactions";

import { SECTION_FORMS } from "../../config/section-forms";
import {
  makeSectionRow,
  makeSeoData,
  renderSectionEditor,
  SECTION_KEYS,
} from "../../pages.fixtures";

import { SectionEditor } from "./index";

describe("SECTION_FORMS", () => {
  it("maps every section schema key to a form", () => {
    expect(new Set(Object.keys(SECTION_FORMS))).toEqual(new Set(Object.keys(SECTION_SCHEMAS)));
  });
});

describe("SectionEditor", () => {
  it.each(SECTION_KEYS)("renders at least one input for %s given an empty row", (section) => {
    renderSectionEditor(makeSectionRow(section, {}));

    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  });

  it("names the accordion after the section", () => {
    renderSectionEditor(makeSectionRow("home:seo", {}));

    expect(screen.getByRole("button", { name: "Home SEO" })).toBeInTheDocument();
  });

  it("keeps Update Section disabled until a field changes", () => {
    const row = makeSectionRow("home:seo", makeSeoData());
    const { rerender } = renderSectionEditor(row);

    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
    typeInto("Search Result Title", "Edited fixture title");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();

    rerender(
      <SectionEditor section={row} isExpanded onToggle={vi.fn()} onSave={vi.fn()} isLoading />,
    );

    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("sends the section key together with the edited data", async () => {
    const onSave = vi.fn();
    const data = makeSeoData();
    const title = "Edited fixture title";

    renderSectionEditor(makeSectionRow("home:seo", data), onSave);

    typeInto("Search Result Title", title);
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "home:seo",
        data: { ...data, title },
      }),
    );
  });

  it("re-syncs to new section data and disables Update Section again", async () => {
    const onSave = vi.fn();
    const title = "Saved fixture title";
    const data = makeSeoData();
    const { rerender } = renderSectionEditor(makeSectionRow("home:seo", data), onSave);

    typeInto("Search Result Title", title);
    clickButton("Update Section");
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    rerender(
      <SectionEditor
        section={makeSectionRow("home:seo", { ...data, title })}
        isExpanded
        onToggle={vi.fn()}
        onSave={onSave}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
    });
  });

  it("keeps unsaved edits when the same section data arrives again", () => {
    const title = "Unsaved fixture title";
    const { rerender } = renderSectionEditor(makeSectionRow("home:seo", makeSeoData()));

    typeInto("Search Result Title", title);
    rerender(
      <SectionEditor
        section={makeSectionRow("home:seo", makeSeoData())}
        isExpanded
        onToggle={vi.fn()}
        onSave={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });
});
