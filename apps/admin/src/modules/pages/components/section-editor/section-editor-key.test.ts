import { describe, expect, it } from "vitest";

import { ENGLISH_LOCALE, UKRAINIAN_LOCALE } from "../../locale.fixtures";
import { makeSectionRow, makeSeoData } from "../../pages.fixtures";

import { getSectionEditorKey } from "./section-editor-key";

describe("getSectionEditorKey", () => {
  it("changes the key when a populated document becomes empty", () => {
    const populated = makeSectionRow("home:seo", makeSeoData());
    const empty = makeSectionRow("home:seo", {});

    expect(getSectionEditorKey(empty, ENGLISH_LOCALE.code)).not.toBe(
      getSectionEditorKey(populated, ENGLISH_LOCALE.code),
    );
  });

  it("keeps the key for equal empty documents", () => {
    expect(getSectionEditorKey(makeSectionRow("home:seo", {}), ENGLISH_LOCALE.code)).toBe(
      getSectionEditorKey(makeSectionRow("home:seo", {}), ENGLISH_LOCALE.code),
    );
  });

  it("keeps the key for equal top-level key sets in any order", () => {
    const populated = makeSectionRow("offer:requisites", { title: "Fixture title", items: [] });
    const reordered = { ...populated, data: { items: [], title: "Changed fixture title" } };

    expect(getSectionEditorKey(reordered, ENGLISH_LOCALE.code)).toBe(
      getSectionEditorKey(populated, ENGLISH_LOCALE.code),
    );
  });

  it("changes the key when a top-level key is dropped or added", () => {
    const populated = makeSectionRow("offer:requisites", { title: "Fixture title", items: [] });
    const dropped = { ...populated, data: { title: "Fixture title" } };
    const added = { ...populated, data: { ...populated.data, extra: "Fixture extra" } };

    expect(getSectionEditorKey(dropped, ENGLISH_LOCALE.code)).not.toBe(
      getSectionEditorKey(populated, ENGLISH_LOCALE.code),
    );
    expect(getSectionEditorKey(added, ENGLISH_LOCALE.code)).not.toBe(
      getSectionEditorKey(populated, ENGLISH_LOCALE.code),
    );
  });

  it("includes the row identity but ignores the timestamp and object identity", () => {
    const row = makeSectionRow("home:seo", makeSeoData());
    const refreshed = { ...row, data: makeSeoData(), updatedAt: new Date().toISOString() };

    expect(getSectionEditorKey(refreshed, ENGLISH_LOCALE.code)).toBe(
      getSectionEditorKey(row, ENGLISH_LOCALE.code),
    );
    expect(
      getSectionEditorKey({ ...row, id: "another-fixture-row" }, ENGLISH_LOCALE.code),
    ).not.toBe(getSectionEditorKey(row, ENGLISH_LOCALE.code));
  });

  it("changes the key when only the locale changes", () => {
    const row = makeSectionRow("home:seo", makeSeoData());

    expect(getSectionEditorKey(row, UKRAINIAN_LOCALE.code)).not.toBe(
      getSectionEditorKey(row, ENGLISH_LOCALE.code),
    );
  });
});
