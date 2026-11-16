import { describe, expect, it } from "vitest";

import { SECTION_FIELD_KINDS, SectionFieldKind } from "@repo/contracts/cms/pages";

import { fieldKindAt, textAt } from "./field-at-path";

describe("fieldKindAt", () => {
  it("looks up flat word and shared fields", () => {
    const tree = SECTION_FIELD_KINDS["home:hero"];

    expect(fieldKindAt(tree, "title")).toBe(SectionFieldKind.WORD);
    expect(fieldKindAt(tree, "buttonHref")).toBe(SectionFieldKind.SHARED);
  });

  it("looks up a field inside a nested group", () => {
    expect(fieldKindAt(SECTION_FIELD_KINDS["contact:form"], "fieldLabels.name")).toBe(
      SectionFieldKind.WORD,
    );
    expect(fieldKindAt(SECTION_FIELD_KINDS["contact:form"], "fieldPlaceholders.contact")).toBe(
      SectionFieldKind.WORD,
    );
  });

  it("looks up a list row field only after a numeric index", () => {
    const tree = SECTION_FIELD_KINDS["home:whyChoose"];

    expect(fieldKindAt(tree, "features.0.title")).toBe(SectionFieldKind.WORD);
    expect(fieldKindAt(tree, "features.1.iconName")).toBe(SectionFieldKind.SHARED);
    expect(fieldKindAt(tree, "features.title")).toBeUndefined();
    expect(fieldKindAt(tree, "features.-1.title")).toBeUndefined();
  });

  it("returns no kind for an unknown or incomplete path", () => {
    const tree = SECTION_FIELD_KINDS["contact:form"];

    for (const path of ["", "unknown", "title.extra", "fieldLabels", "fieldLabels.unknown"]) {
      expect(fieldKindAt(tree, path)).toBeUndefined();
    }

    expect(fieldKindAt(SECTION_FIELD_KINDS["home:whyChoose"], "features.0")).toBeUndefined();
  });
});

describe("textAt", () => {
  it("reads English text at flat, group and list paths", () => {
    expect(textAt({ title: "English title" }, "title")).toBe("English title");
    expect(textAt({ fieldLabels: { name: "Your name" } }, "fieldLabels.name")).toBe("Your name");
    expect(
      textAt({ features: [{ title: "First" }, { title: "Second" }] }, "features.1.title"),
    ).toBe("Second");
  });

  it("returns empty text for unknown paths and non-string values", () => {
    const data = { title: 42, fieldLabels: null, features: [{ title: "First" }, null] };

    for (const path of [
      "",
      "missing",
      "title",
      "title.extra",
      "fieldLabels.name",
      "features.title",
      "features.1.title",
      "features.2.title",
      "features.-1.title",
      "features.0",
    ]) {
      expect(textAt(data, path)).toBe("");
    }
  });
});
