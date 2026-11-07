import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PageSlug } from "@repo/contracts/cms/pages";

import { UNPARSABLE_SECTION_DATA, UK_ABOUT_HERO } from "../pages/__fixtures__/section-data";

import { GERMAN, UKRAINIAN } from "./__fixtures__/locale-catalog";
import { countServedSections } from "./translation-progress";

type SectionRow = Parameters<typeof countServedSections>[0][number];

const UKRAINIAN_SECTION_COUNT = 2;

const makeSectionRow = (overrides: Partial<SectionRow> = {}): SectionRow => ({
  locale: UKRAINIAN.code,
  pageSlug: PageSlug.ABOUT,
  section: "about:hero",
  data: UK_ABOUT_HERO,
  ...overrides,
});

describe("countServedSections", () => {
  it("counts a served row", () => {
    expect(countServedSections([makeSectionRow()])).toEqual(new Map([[UKRAINIAN.code, 1]]));
  });

  it.each([{}, { retiredTitle: "Old title" }, UNPARSABLE_SECTION_DATA])(
    "skips an unserved row with data %j",
    (data) => {
      expect(countServedSections([makeSectionRow({ data })]).size).toBe(0);
    },
  );

  it("skips a section outside the schemas", () => {
    expect(countServedSections([makeSectionRow({ section: "about:retired" })]).size).toBe(0);
  });

  it("skips a section stored under another page slug", () => {
    expect(countServedSections([makeSectionRow({ pageSlug: PageSlug.HOME })]).size).toBe(0);
  });

  it.each([{ pageSlug: "missing" }, { pageSlug: "constructor" }, { section: "constructor" }])(
    "skips an unknown page or prototype key %j",
    (overrides) => {
      expect(countServedSections([makeSectionRow(overrides)]).size).toBe(0);
    },
  );

  it("counts a row whose nested list item is partial", () => {
    const row = makeSectionRow({
      section: "about:journey",
      data: { timeline: [{ year: "2026" }] },
    });

    expect(countServedSections([row]).get(UKRAINIAN.code)).toBe(1);
  });

  it("counts each locale on its own, including English", () => {
    const rows = [
      makeSectionRow(),
      makeSectionRow({ section: "about:cta" }),
      makeSectionRow({ locale: GERMAN.code }),
      makeSectionRow({ locale: DEFAULT_LOCALE_CODE }),
    ];

    expect(countServedSections(rows)).toEqual(
      new Map([
        [UKRAINIAN.code, UKRAINIAN_SECTION_COUNT],
        [GERMAN.code, 1],
        [DEFAULT_LOCALE_CODE, 1],
      ]),
    );
  });
});
