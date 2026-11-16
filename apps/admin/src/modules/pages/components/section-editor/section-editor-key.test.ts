import { describe, expect, it } from "vitest";

import { SectionTranslationState } from "@repo/contracts/cms/pages";

import { ENGLISH_LOCALE, UKRAINIAN_LOCALE } from "../../locale.fixtures";
import { makeLocalizedSectionRow, makeSectionRow, makeSeoData } from "../../pages.fixtures";

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

  it("gives an empty-string leaf the same key as an absent leaf", () => {
    const absent = makeSectionRow("home:hero", {});
    const empty = makeSectionRow("home:hero", { buttonHref: "" });

    expect(getSectionEditorKey(empty, UKRAINIAN_LOCALE.code)).toBe(
      getSectionEditorKey(absent, UKRAINIAN_LOCALE.code),
    );
  });

  it("changes the key when an empty-string leaf gains or loses a value", () => {
    const empty = makeSectionRow("home:hero", { buttonHref: "" });
    const populated = makeSectionRow("home:hero", { buttonHref: "/storefront" });

    expect(getSectionEditorKey(populated, UKRAINIAN_LOCALE.code)).not.toBe(
      getSectionEditorKey(empty, UKRAINIAN_LOCALE.code),
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

  it("changes the key when a nested property is added or dropped", () => {
    const initial = makeSectionRow("contact:form", { fieldLabels: { contact: "Contact" } });
    const populated = makeSectionRow("contact:form", {
      fieldLabels: { contact: "Contact", name: "Name" },
    });
    const emptyGroup = makeSectionRow("contact:form", { fieldLabels: {} });

    expect(getSectionEditorKey(populated, UKRAINIAN_LOCALE.code)).not.toBe(
      getSectionEditorKey(initial, UKRAINIAN_LOCALE.code),
    );
    expect(getSectionEditorKey(emptyGroup, UKRAINIAN_LOCALE.code)).not.toBe(
      getSectionEditorKey(initial, UKRAINIAN_LOCALE.code),
    );
    expect(getSectionEditorKey(emptyGroup, UKRAINIAN_LOCALE.code)).not.toBe(
      getSectionEditorKey(makeSectionRow("contact:form", {}), UKRAINIAN_LOCALE.code),
    );
  });

  it("keeps the key for equal nested property sets regardless of order or values", () => {
    const initial = makeSectionRow("contact:form", {
      fieldLabels: { contact: "Contact", name: "Name" },
      fieldPlaceholders: { contact: "Enter contact", message: "Enter message" },
    });
    const reordered = makeSectionRow("contact:form", {
      fieldPlaceholders: { message: "Changed message", contact: "Changed contact" },
      fieldLabels: { name: "Changed name", contact: "Changed contact" },
    });

    expect(getSectionEditorKey(reordered, UKRAINIAN_LOCALE.code)).toBe(
      getSectionEditorKey(initial, UKRAINIAN_LOCALE.code),
    );
  });

  it("ignores translation state and reference changes for an equal nested document", () => {
    const initial = makeLocalizedSectionRow("contact:form", SectionTranslationState.DRAFT);
    const refreshed = {
      ...initial,
      updatedAt: new Date().toISOString(),
      translation: initial.translation && {
        ...initial.translation,
        state: SectionTranslationState.ENGLISH_NEWER,
        english: { data: {}, updatedAt: new Date().toISOString() },
      },
    };

    expect(getSectionEditorKey(refreshed, UKRAINIAN_LOCALE.code)).toBe(
      getSectionEditorKey(initial, UKRAINIAN_LOCALE.code),
    );
  });
});
