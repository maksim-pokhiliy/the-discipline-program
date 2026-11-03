import { describe, expect, it } from "vitest";

import { makeSectionRow, makeSeoData } from "../../pages.fixtures";

import { getSectionEditorKey } from "./section-editor-key";

describe("getSectionEditorKey", () => {
  it("changes the key when a populated document becomes empty", () => {
    const populated = makeSectionRow("home:seo", makeSeoData());
    const empty = makeSectionRow("home:seo", {});

    expect(getSectionEditorKey(empty)).not.toBe(getSectionEditorKey(populated));
  });

  it("keeps the key for equal empty documents", () => {
    expect(getSectionEditorKey(makeSectionRow("home:seo", {}))).toBe(
      getSectionEditorKey(makeSectionRow("home:seo", {})),
    );
  });

  it("keeps the key for equal top-level key sets in any order", () => {
    const populated = makeSectionRow("offer:requisites", { title: "Fixture title", items: [] });
    const reordered = { ...populated, data: { items: [], title: "Changed fixture title" } };

    expect(getSectionEditorKey(reordered)).toBe(getSectionEditorKey(populated));
  });

  it("changes the key when a top-level key is dropped or added", () => {
    const populated = makeSectionRow("offer:requisites", { title: "Fixture title", items: [] });
    const dropped = { ...populated, data: { title: "Fixture title" } };
    const added = { ...populated, data: { ...populated.data, extra: "Fixture extra" } };

    expect(getSectionEditorKey(dropped)).not.toBe(getSectionEditorKey(populated));
    expect(getSectionEditorKey(added)).not.toBe(getSectionEditorKey(populated));
  });

  it("includes the row identity but ignores the timestamp and object identity", () => {
    const row = makeSectionRow("home:seo", makeSeoData());
    const refreshed = { ...row, data: makeSeoData(), updatedAt: new Date() };

    expect(getSectionEditorKey(refreshed)).toBe(getSectionEditorKey(row));
    expect(getSectionEditorKey({ ...row, id: "another-fixture-row" })).not.toBe(
      getSectionEditorKey(row),
    );
  });
});
