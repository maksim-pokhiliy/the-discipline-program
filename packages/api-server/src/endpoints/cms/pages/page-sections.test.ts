import { type Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PageSlug, SectionTranslationState } from "@repo/contracts/cms/pages";

import { UNPARSABLE_SECTION_DATA, UK_ABOUT_HERO } from "./__fixtures__/section-data";
import {
  isSectionOfPage,
  isServedSectionRow,
  lockPageSection,
  parseServedSectionData,
  readableSectionData,
  sectionTranslationState,
} from "./page-sections";

type SectionRow = Parameters<typeof sectionTranslationState>[0];

const ROW_UPDATED_AT = new Date("2026-11-01T12:00:00.000Z");
const NEWER_UPDATED_AT = new Date("2026-11-02T12:00:00.000Z");
const OLDER_UPDATED_AT = new Date("2026-10-31T12:00:00.000Z");
const makeSectionRow = (overrides: Partial<SectionRow> = {}): SectionRow => ({
  pageSlug: PageSlug.ABOUT,
  section: "about:hero",
  data: UK_ABOUT_HERO,
  isActive: true,
  updatedAt: ROW_UPDATED_AT,
  ...overrides,
});

describe("parseServedSectionData", () => {
  it("serves data with a known key", () => {
    expect(parseServedSectionData("about:hero", UK_ABOUT_HERO)).toEqual({
      kind: "served",
      data: UK_ABOUT_HERO,
    });
  });

  it("returns empty for an empty object", () => {
    expect(parseServedSectionData("about:hero", {})).toEqual({ kind: "empty" });
  });

  it("returns empty for unknown keys only", () => {
    expect(parseServedSectionData("about:hero", { retiredTitle: "Old title" })).toEqual({
      kind: "empty",
    });
  });

  it("returns invalid with the Zod error for a type mismatch", () => {
    const result = parseServedSectionData("about:hero", UNPARSABLE_SECTION_DATA);

    expect(result.kind).toBe("invalid");

    if (result.kind === "invalid") {
      expect(result.error.issues).toEqual([
        expect.objectContaining({ path: ["title"], code: "invalid_type" }),
      ]);
    }
  });

  it("serves a valid partial nested item", () => {
    const data = { timeline: [{ year: "2026" }] };

    expect(parseServedSectionData("about:journey", data)).toEqual({ kind: "served", data });
  });
});

describe("isSectionOfPage", () => {
  it("accepts a section belonging to its page", () => {
    expect(isSectionOfPage(PageSlug.ABOUT, "about:hero")).toBe(true);
  });

  it.each([
    [PageSlug.HOME, "about:hero"],
    [PageSlug.ABOUT, "about:retired"],
    ["constructor", "about:hero"],
    [PageSlug.ABOUT, "constructor"],
  ])("refuses the page and section relation %s / %s", (pageSlug, section) => {
    expect(isSectionOfPage(pageSlug, section)).toBe(false);
  });
});

describe("isServedSectionRow", () => {
  it("checks the served data and page relation independently of activity", () => {
    expect(isServedSectionRow(makeSectionRow())).toBe(true);
    expect(isServedSectionRow(makeSectionRow({ isActive: false }))).toBe(true);
    expect(isServedSectionRow(makeSectionRow({ data: {} }))).toBe(false);
    expect(isServedSectionRow(makeSectionRow({ pageSlug: PageSlug.HOME }))).toBe(false);
  });
});

describe("sectionTranslationState", () => {
  it.each<{ reason: string; overrides: Partial<SectionRow> }>([
    { reason: "fails to parse", overrides: { data: UNPARSABLE_SECTION_DATA } },
    { reason: "is empty", overrides: { data: {} } },
    { reason: "holds unknown keys only", overrides: { data: { retiredTitle: "Old title" } } },
    { reason: "belongs to another page", overrides: { pageSlug: PageSlug.HOME } },
    { reason: "has an unknown section", overrides: { section: "about:retired" } },
  ])("is not translated when the row $reason", ({ overrides }) => {
    expect(sectionTranslationState(makeSectionRow(overrides), ROW_UPDATED_AT)).toBe(
      SectionTranslationState.NOT_TRANSLATED,
    );
    expect(
      sectionTranslationState(makeSectionRow({ ...overrides, isActive: false }), ROW_UPDATED_AT),
    ).toBe(SectionTranslationState.NOT_TRANSLATED);
  });

  it("is a draft when an inactive row would otherwise be served", () => {
    expect(sectionTranslationState(makeSectionRow({ isActive: false }), ROW_UPDATED_AT)).toBe(
      SectionTranslationState.DRAFT,
    );
  });

  it.each([ROW_UPDATED_AT, OLDER_UPDATED_AT])(
    "is translated when the reader would serve the locale's own row and English is no newer (%s)",
    (englishUpdatedAt) => {
      expect(sectionTranslationState(makeSectionRow(), englishUpdatedAt)).toBe(
        SectionTranslationState.TRANSLATED,
      );
    },
  );

  it("is English newer when a served row is older than its English row", () => {
    expect(sectionTranslationState(makeSectionRow(), NEWER_UPDATED_AT)).toBe(
      SectionTranslationState.ENGLISH_NEWER,
    );
  });

  it("stays a draft when a draft is older than its English row", () => {
    expect(sectionTranslationState(makeSectionRow({ isActive: false }), NEWER_UPDATED_AT)).toBe(
      SectionTranslationState.DRAFT,
    );
  });

  it("uses the reader's treatment of blank strings and partial list rows", () => {
    const row = makeSectionRow({
      section: "about:journey",
      data: { timeline: [{ year: "2026" }] },
    });

    expect(sectionTranslationState(row, ROW_UPDATED_AT)).toBe(SectionTranslationState.TRANSLATED);
    expect(sectionTranslationState(makeSectionRow({ data: { title: "" } }), ROW_UPDATED_AT)).toBe(
      SectionTranslationState.TRANSLATED,
    );
  });
});

describe("readableSectionData", () => {
  it("returns the parsed data of a readable row", () => {
    expect(readableSectionData("about:hero", { ...UK_ABOUT_HERO, retiredTitle: "Old" })).toEqual({
      data: UK_ABOUT_HERO,
      isReadable: true,
    });
  });

  it("returns {} and marks a row that does not parse", () => {
    expect(readableSectionData("about:hero", UNPARSABLE_SECTION_DATA)).toEqual({
      data: {},
      isReadable: false,
    });
  });

  it.each([null, [], "old", 0])(
    "normalizes a non-record value %j to a readable empty row",
    (data) => {
      expect(readableSectionData("about:hero", data)).toEqual({ data: {}, isReadable: true });
    },
  );

  it("keeps a partial nested row readable", () => {
    const data = { timeline: [{ year: "2026" }] };

    expect(readableSectionData("about:journey", data)).toEqual({ data, isReadable: true });
  });
});

describe("lockPageSection", () => {
  it("takes a transaction advisory lock shared by every locale of the same page section", async () => {
    const tx = {
      $executeRaw: vi.fn<Prisma.TransactionClient["$executeRaw"]>().mockResolvedValue(0),
    };

    await lockPageSection(tx, PageSlug.HOME, "home:hero");

    expect(tx.$executeRaw).toHaveBeenCalledExactlyOnceWith(
      ["SELECT pg_advisory_xact_lock(hashtext(", "))"],
      "cms-page-section:home:home:hero",
    );
  });
});
