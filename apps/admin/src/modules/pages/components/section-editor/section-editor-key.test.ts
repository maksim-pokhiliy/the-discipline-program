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

  it("keeps the key when a nonempty document changes or contains an empty array", () => {
    const populated = makeSectionRow("offer:requisites", { title: "Fixture title" });
    const partial = { ...populated, data: { title: "Changed fixture title" } };
    const emptyArray = { ...populated, data: { items: [] } };

    expect(getSectionEditorKey(partial)).toBe(getSectionEditorKey(populated));
    expect(getSectionEditorKey(emptyArray)).toBe(getSectionEditorKey(populated));
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
