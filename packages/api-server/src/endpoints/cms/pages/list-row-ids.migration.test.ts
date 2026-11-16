import { readFileSync } from "node:fs";

import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../test/helpers";
import { GERMAN, seedLocaleCatalog, UKRAINIAN } from "../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { readTranslationRow, seedTranslationRow } from "./__fixtures__/translation-rows";

const SQL = readFileSync(
  new URL(
    "../../../../prisma/migrations/20261116120000_cms_list_row_ids/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const STATEMENTS = SQL.split(/^-- .*$/m)
  .map((statement) => statement.trim())
  .filter(Boolean);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FAQ = PAGE_SECTIONS_MAP.faq.content;
const LIST_FIELDS: readonly { pageSlug: PageSlug; section: SectionSchemaKey; field: string }[] = [
  { pageSlug: PageSlug.HOME, section: "home:whyChoose", field: "features" },
  { pageSlug: PageSlug.ABOUT, section: "about:journey", field: "timeline" },
  { pageSlug: PageSlug.ABOUT, section: "about:credentials", field: "items" },
  { pageSlug: PageSlug.FAQ, section: "faq:content", field: "items" },
  { pageSlug: PageSlug.OFFER, section: "offer:requisites", field: "items" },
  { pageSlug: PageSlug.OFFER, section: "offer:terms", field: "blocks" },
];

const runMigration = async (): Promise<number[]> => {
  expect(STATEMENTS).toHaveLength(4);

  return cleanupRaw.$transaction(async (tx) => {
    const counts: number[] = [];

    for (const statement of STATEMENTS) {
      counts.push(await tx.$executeRawUnsafe(statement));
    }

    return counts;
  });
};

const listIds = (data: Prisma.JsonValue | undefined, field: string) => {
  const list =
    data !== null && typeof data === "object" && !Array.isArray(data) ? data[field] : undefined;

  if (!Array.isArray(list)) {
    throw new Error("The migrated field is not a list");
  }

  return list.map((row) =>
    row !== null && typeof row === "object" && !Array.isArray(row) ? row.id : undefined,
  );
};

const refusalMessage = (nonText: number, repeated: number): string =>
  `Migration 20261116120000_cms_list_row_ids refused: the page sections hold ${nonText} list row id(s) that are not text and ${repeated} id(s) repeated inside one list, and the editor cannot tell those rows apart. Inspect and fix these rows by hand, then run "prisma migrate resolve --rolled-back 20261116120000_cms_list_row_ids" and deploy again.`;

let snapshot: MarketingPagesState;

beforeAll(async () => {
  snapshot = await captureMarketingPagesState();
});

beforeEach(async () => {
  await clearMarketingPagesState();
  await seedLocaleCatalog();
});

afterAll(async () => {
  await restoreMarketingPagesState(snapshot);
});

describe("migration 20261116120000_cms_list_row_ids", () => {
  it("reads exactly four header-delimited statements in the ratified order", () => {
    expect(STATEMENTS).toHaveLength(4);
    expect(SQL.match(/^-- .*$/gm)).toEqual([
      "-- SetLockTimeout",
      "-- AssertListRowIdsAreText",
      "-- AddEnglishListRowIds",
      "-- CopyEnglishListRowIds",
    ]);
  });

  it("mints distinct English ids, keeps existing ids, and changes no other key, row or metadata", async () => {
    const first = { question: "First", extra: { nested: ["kept", 2] } };
    const second = { id: "", question: "Second" };
    const kept = { id: "kept", question: "Third", answer: "Unchanged" };
    const data = { title: "FAQ", extra: true, items: [first, second, kept] };

    await seedTranslationRow(PageSlug.FAQ, FAQ, data, DEFAULT_LOCALE_CODE, false);

    const before = await captureMarketingPagesState();

    await runMigration();

    const ids = listIds((await readTranslationRow(PageSlug.FAQ, FAQ))?.data, "items");

    expect(ids).toEqual([expect.stringMatching(UUID), expect.stringMatching(UUID), "kept"]);
    expect(new Set(ids).size).toBe(3);
    expect(await captureMarketingPagesState()).toEqual({
      ...before,
      sections: before.sections.map((row) => ({
        ...row,
        data: { ...data, items: [{ ...first, id: ids[0] }, { ...second, id: ids[1] }, kept] },
      })),
    });
  });

  it.each([
    {
      name: "copies by position, keeps own ids and leaves past-end rows untouched",
      englishIds: ["first", "second", "third"],
      items: [
        { question: "Перший", extra: [1, 2] },
        { id: "", question: "Другий" },
        { id: "own", question: "Третій" },
        { question: "Past the English end" },
      ],
      expectedIds: ["first", "second", "own", undefined],
      updatedRows: 1,
    },
    {
      name: "skips the English id already held by another row of the list",
      englishIds: ["a", "b"],
      items: [
        { id: "b", question: "Kept" },
        { question: "Skipped", extra: true },
      ],
      expectedIds: ["b", undefined],
      updatedRows: 0,
    },
    {
      name: "copies a free English id while skipping an id already held by the list",
      englishIds: ["a", "b", "c"],
      items: [
        { question: "Copied", extra: [1, 2] },
        { question: "Skipped" },
        { id: "b", question: "Own" },
      ],
      expectedIds: ["a", undefined, "b"],
      updatedRows: 1,
    },
  ])(
    "$name without changing other keys or metadata, and is idempotent",
    async ({ englishIds, items, expectedIds, updatedRows }) => {
      const english = { items: englishIds.map((id) => ({ id })) };
      const data = { title: "Питання", items };

      await seedTranslationRow(PageSlug.FAQ, FAQ, english, DEFAULT_LOCALE_CODE, false);
      await seedTranslationRow(PageSlug.FAQ, FAQ, data, UKRAINIAN.code, true);

      const before = await captureMarketingPagesState();

      expect((await runMigration()).slice(2)).toEqual([0, updatedRows]);

      const once = await captureMarketingPagesState();

      expect(once).toEqual({
        ...before,
        sections: before.sections.map((row) =>
          row.locale === UKRAINIAN.code
            ? {
                ...row,
                data: {
                  ...data,
                  items: items.map((item, index) =>
                    expectedIds[index] === undefined ? item : { ...item, id: expectedIds[index] },
                  ),
                },
              }
            : row,
        ),
      });
      expect((await runMigration()).slice(2)).toEqual([0, 0]);
      expect(await captureMarketingPagesState()).toEqual(once);
    },
  );

  it.each<{
    name: string;
    rows: {
      pageSlug: PageSlug;
      section: SectionSchemaKey;
      locale: LocaleCode;
      data: Prisma.InputJsonValue;
      expectedData?: unknown;
    }[];
  }>([
    {
      name: "copies no id from a different language when English has no rows",
      rows: [
        { pageSlug: PageSlug.FAQ, section: FAQ, locale: "en", data: { items: [] } },
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: GERMAN.code,
          data: { items: [{ id: "de-row", question: "German", extra: true }] },
        },
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: UKRAINIAN.code,
          data: { items: [{ question: "Ukrainian" }] },
        },
      ],
    },
    {
      name: "copies no id from a different section on the same page",
      rows: [
        {
          pageSlug: PageSlug.ABOUT,
          section: "about:hero",
          locale: "en",
          data: { items: [{ id: "hero" }] },
        },
        {
          pageSlug: PageSlug.ABOUT,
          section: "about:credentials",
          locale: "en",
          data: { items: [] },
        },
        {
          pageSlug: PageSlug.ABOUT,
          section: "about:credentials",
          locale: UKRAINIAN.code,
          data: { items: [{}] },
        },
      ],
    },
    {
      name: "keeps a whitespace English id as stored without refusing the run",
      rows: [
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: "en",
          data: { items: [{ id: " ", question: "English" }] },
        },
      ],
    },
    {
      name: "mints an English id beside a non-array translation without raising or changing it",
      rows: [
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: "en",
          data: { items: [{ question: "E" }] },
          expectedData: { items: [{ question: "E", id: expect.stringMatching(UUID) }] },
        },
        { pageSlug: PageSlug.FAQ, section: FAQ, locale: UKRAINIAN.code, data: { items: {} } },
      ],
    },
    {
      name: "copies English ids to two languages independently",
      rows: [
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: "en",
          data: {
            items: [
              { id: "a", question: "English A" },
              { id: "b", question: "English B" },
            ],
          },
        },
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: UKRAINIAN.code,
          data: {
            title: "Ukrainian",
            items: [{ question: "Ukrainian A" }, { answer: "Ukrainian B" }],
          },
          expectedData: {
            title: "Ukrainian",
            items: [
              { id: "a", question: "Ukrainian A" },
              { id: "b", answer: "Ukrainian B" },
            ],
          },
        },
        {
          pageSlug: PageSlug.FAQ,
          section: FAQ,
          locale: GERMAN.code,
          data: { extra: true, items: [{ answer: "German A" }, { question: "German B" }] },
          expectedData: {
            extra: true,
            items: [
              { id: "a", answer: "German A" },
              { id: "b", question: "German B" },
            ],
          },
        },
      ],
    },
  ])("$name, preserving every other key and metadata", async ({ rows }) => {
    for (const { pageSlug, section, data, locale } of rows) {
      await seedTranslationRow(pageSlug, section, data, locale, false);
    }

    const before = await captureMarketingPagesState();

    await runMigration();

    expect(await captureMarketingPagesState()).toEqual({
      ...before,
      sections: before.sections.map((row) => {
        const seed = rows.find(
          ({ pageSlug, section, locale }) =>
            pageSlug === row.pageSlug && section === row.section && locale === row.locale,
        );

        return { ...row, data: seed?.expectedData ?? row.data };
      }),
    });
  });

  it.each(LIST_FIELDS)(
    "mints and copies the English id for $section / $field",
    async ({ pageSlug, section, field }) => {
      await seedTranslationRow(pageSlug, section, { [field]: [{ title: "English" }] });
      await seedTranslationRow(
        pageSlug,
        section,
        { [field]: [{ title: "Українська" }] },
        UKRAINIAN.code,
        false,
      );

      const before = await captureMarketingPagesState();

      await runMigration();

      const ids = listIds((await readTranslationRow(pageSlug, section))?.data, field);

      expect(ids).toEqual([expect.stringMatching(UUID)]);
      expect(await captureMarketingPagesState()).toEqual({
        ...before,
        sections: before.sections.map((row) => ({
          ...row,
          data: {
            [field]: [
              { title: row.locale === DEFAULT_LOCALE_CODE ? "English" : "Українська", id: ids[0] },
            ],
          },
        })),
      });
    },
  );

  it("keeps non-object elements and does not copy an id from a non-object English position", async () => {
    const scalars = [null, "plain", 7, false, ["nested"]];
    const english = { items: [...scalars, { question: "Last" }] };
    const ukrainian = {
      items: [{ question: "No English object" }, ...scalars.slice(1), { question: "Останній" }],
    };

    await seedTranslationRow(PageSlug.FAQ, FAQ, english);
    await seedTranslationRow(PageSlug.FAQ, FAQ, ukrainian, UKRAINIAN.code, false);

    const before = await captureMarketingPagesState();

    await runMigration();

    const ids = listIds((await readTranslationRow(PageSlug.FAQ, FAQ))?.data, "items");

    expect(ids.slice(0, scalars.length)).toEqual(scalars.map(() => undefined));
    expect(ids[scalars.length]).toEqual(expect.stringMatching(UUID));
    expect(await captureMarketingPagesState()).toEqual({
      ...before,
      sections: before.sections.map((row) => ({
        ...row,
        data: {
          items: [
            ...(row.locale === DEFAULT_LOCALE_CODE ? scalars : ukrainian.items.slice(0, -1)),
            {
              question: row.locale === DEFAULT_LOCALE_CODE ? "Last" : "Останній",
              id: ids[scalars.length],
            },
          ],
        },
      })),
    });
  });

  it.each([
    {},
    { items: null },
    { items: {} },
    { items: "not an array" },
    { items: 7 },
    { items: [] },
  ])("leaves a missing, empty or non-array list untouched: %j", async (data) => {
    await seedTranslationRow(PageSlug.FAQ, FAQ, data);
    await seedTranslationRow(
      PageSlug.FAQ,
      FAQ,
      { items: [{ question: "No English list" }] },
      UKRAINIAN.code,
    );

    const before = await captureMarketingPagesState();

    await runMigration();

    expect(await captureMarketingPagesState()).toEqual(before);
  });

  it("leaves a list in a section outside the six pairs untouched", async () => {
    const data = { items: [{ title: "Unrelated list" }, { id: 3 }] };

    await seedTranslationRow(PageSlug.HOME, PAGE_SECTIONS_MAP.home.hero, data);
    await seedTranslationRow(
      PageSlug.HOME,
      PAGE_SECTIONS_MAP.home.hero,
      data,
      UKRAINIAN.code,
      false,
    );

    const before = await captureMarketingPagesState();

    await runMigration();

    expect(await captureMarketingPagesState()).toEqual(before);
  });

  it("is idempotent after minting and copying ids", async () => {
    await seedTranslationRow(PageSlug.FAQ, FAQ, { items: [{ question: "English" }] });
    await seedTranslationRow(
      PageSlug.FAQ,
      FAQ,
      { items: [{ question: "Українська" }] },
      UKRAINIAN.code,
      false,
    );
    await runMigration();

    const once = await captureMarketingPagesState();

    await runMigration();

    expect(await captureMarketingPagesState()).toEqual(once);
  });

  it.each([
    {
      name: "repeated English id",
      rows: [{ id: "same" }, { id: "same" }],
      locale: DEFAULT_LOCALE_CODE,
      nonText: 0,
      repeated: 1,
    },
    {
      name: "repeated Ukrainian id",
      rows: [{ id: "same" }, { id: "same" }],
      locale: UKRAINIAN.code,
      nonText: 0,
      repeated: 1,
    },
    { name: "numeric id", rows: [{ id: 4 }], locale: DEFAULT_LOCALE_CODE, nonText: 1, repeated: 0 },
    { name: "null id", rows: [{ id: null }], locale: DEFAULT_LOCALE_CODE, nonText: 1, repeated: 0 },
    {
      name: "boolean id",
      rows: [{ id: false }],
      locale: DEFAULT_LOCALE_CODE,
      nonText: 1,
      repeated: 0,
    },
    { name: "object id", rows: [{ id: {} }], locale: UKRAINIAN.code, nonText: 1, repeated: 0 },
    { name: "array id", rows: [{ id: [] }], locale: UKRAINIAN.code, nonText: 1, repeated: 0 },
  ])(
    "refuses $name atomically with the operator message",
    async ({ rows, locale, nonText, repeated }) => {
      await seedTranslationRow(PageSlug.FAQ, FAQ, { items: rows }, locale);
      await seedTranslationRow(PageSlug.ABOUT, PAGE_SECTIONS_MAP.about.journey, {
        timeline: [{ title: "Must stay id-less" }],
      });

      const before = await captureMarketingPagesState();

      await expect(runMigration()).rejects.toThrow(refusalMessage(nonText, repeated));

      expect(await captureMarketingPagesState()).toEqual(before);
    },
  );
});
