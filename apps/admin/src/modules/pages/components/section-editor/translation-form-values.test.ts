import { describe, expect, it } from "vitest";

import { SECTION_FIELD_KINDS, SECTION_SCHEMAS } from "@repo/contracts/cms/pages";

import { makePopulatedSectionRow, SECTION_KEYS } from "../../pages.fixtures";

import {
  buildTranslationSeed,
  isSectionWriteData,
  parseSectionWriteData,
} from "./translation-form-values";

const makeFeatureRows = () => [
  { id: "second", iconName: "star", title: "Second translated title" },
  { id: "first", iconName: "bolt", description: "First translated description" },
];

describe("buildTranslationSeed", () => {
  it("fills unwritten words and keeps the shared link and image from the data", () => {
    const data = { buttonHref: "/contact", backgroundImage: "fixture.png", title: "Written title" };

    expect(buildTranslationSeed(SECTION_FIELD_KINDS["home:hero"], data)).toEqual({
      ...data,
      subtitle: "",
      buttonText: "",
    });
  });

  it("fills non-string leaves with empty strings and drops unclassified keys", () => {
    const data = { title: null, subtitle: 1, buttonText: [], buttonHref: {}, retired: "ignored" };

    expect(buildTranslationSeed(SECTION_FIELD_KINDS["home:hero"], data)).toEqual({
      title: "",
      subtitle: "",
      buttonText: "",
      buttonHref: "",
      backgroundImage: "",
    });
  });

  it("fills nested groups while preserving their written words", () => {
    const seed = buildTranslationSeed(SECTION_FIELD_KINDS["contact:form"], {
      fieldLabels: { name: "Written name" },
      fieldPlaceholders: { contact: "Written contact" },
    });

    expect(seed).toMatchObject({
      title: "",
      fieldLabels: { name: "Written name", contact: "", program: "", message: "" },
      fieldPlaceholders: { contact: "Written contact", message: "" },
    });
  });

  it("fills missing or non-object groups", () => {
    const seed = buildTranslationSeed(SECTION_FIELD_KINDS["contact:form"], { fieldLabels: [] });

    expect(seed.fieldLabels).toEqual({ name: "", contact: "", program: "", message: "" });
    expect(seed.fieldPlaceholders).toEqual({ contact: "", message: "" });
  });

  it("keeps the delivered rows in their order without adding row metadata", () => {
    const rows = makeFeatureRows();
    const original = structuredClone(rows);
    const seed = buildTranslationSeed(SECTION_FIELD_KINDS["home:whyChoose"], { features: rows });

    expect(seed.features).toEqual([
      { ...rows[0], description: "" },
      { ...rows[1], title: "" },
    ]);
    expect(rows).toEqual(original);
  });

  it("fills malformed rows and treats a missing or non-array list as empty", () => {
    const tree = SECTION_FIELD_KINDS["faq:content"];

    expect(buildTranslationSeed(tree, { items: [null, { question: "Written question" }] })).toEqual(
      {
        title: "",
        subtitle: "",
        items: [
          { question: "", answer: "" },
          { question: "Written question", answer: "" },
        ],
      },
    );
    expect(buildTranslationSeed(tree, {}).items).toEqual([]);
    expect(buildTranslationSeed(tree, { items: {} }).items).toEqual([]);
  });
});

describe("isSectionWriteData", () => {
  it.each(SECTION_KEYS)("accepts populated and empty translation seeds for %s", (section) => {
    const data = makePopulatedSectionRow(section).data;
    const seed = buildTranslationSeed(SECTION_FIELD_KINDS[section], data);
    const emptySeed = buildTranslationSeed(SECTION_FIELD_KINDS[section], {});

    expect(seed).toEqual(data);
    expect(isSectionWriteData(section, seed)).toBe(true);
    expect(isSectionWriteData(section, emptySeed)).toBe(true);
    expect(SECTION_SCHEMAS[section].safeParse(seed).success).toBe(true);
  });

  it("rejects invalid scalar, group and row values", () => {
    expect(isSectionWriteData("home:hero", { title: 1 })).toBe(false);
    expect(isSectionWriteData("contact:form", { fieldLabels: { name: [] } })).toBe(false);
    expect(isSectionWriteData("faq:content", { items: [{ answer: false }] })).toBe(false);
  });
});

describe("parseSectionWriteData", () => {
  it("strips unknown fields while preserving a partial section", () => {
    expect(
      parseSectionWriteData("contact:form", {
        title: "Written title",
        retired: "discarded",
        fieldLabels: { name: "Written name", retired: "discarded" },
      }),
    ).toEqual({ title: "Written title", fieldLabels: { name: "Written name" } });
  });

  it("keeps list values in their submitted order", () => {
    const items = [{ question: "Second" }, { question: "First" }, { answer: "Added" }];

    expect(parseSectionWriteData("faq:content", { items })).toEqual({ items });
  });

  it("accepts a clear and rejects a malformed section", () => {
    expect(parseSectionWriteData("home:hero", {})).toEqual({});
    expect(() => parseSectionWriteData("home:hero", { title: 1 })).toThrow();
  });
});
