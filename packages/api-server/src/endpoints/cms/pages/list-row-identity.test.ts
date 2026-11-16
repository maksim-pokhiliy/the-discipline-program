import { type Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type * as PageContracts from "@repo/contracts/cms/pages";
import { SECTION_FIELD_KINDS, type SectionSchemaKey } from "@repo/contracts/cms/pages";
import { BadRequestError } from "@repo/errors";

import { rowIdOf, withEnglishRowIds } from "./list-row-identity";

vi.mock("@repo/contracts/cms/pages", async (importOriginal) => {
  const actual = await importOriginal<typeof PageContracts>();
  const list = {
    list: { id: actual.SectionFieldKind.SHARED, title: actual.SectionFieldKind.WORD },
    identity: "id",
  };
  const nested = { group: { items: list, otherItems: list } };
  const fieldLabels = { group: { nested } };

  return {
    ...actual,
    SECTION_FIELD_KINDS: {
      ...actual.SECTION_FIELD_KINDS,
      "contact:form": { ...actual.SECTION_FIELD_KINDS["contact:form"], fieldLabels },
    },
  };
});

const FAQ_LIST = SECTION_FIELD_KINDS["faq:content"].items;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rowIdsSchema = z.array(z.object({ id: z.string() }));
const LIST_CASES = [
  { section: "home:whyChoose", list: "features" },
  { section: "about:journey", list: "timeline" },
  { section: "about:credentials", list: "items" },
  { section: "faq:content", list: "items" },
  { section: "offer:requisites", list: "items" },
  { section: "offer:terms", list: "blocks" },
] satisfies readonly { section: SectionSchemaKey; list: string }[];

const makeRow = (name: string, id?: Prisma.InputJsonValue | null): Prisma.InputJsonObject => ({
  title: `${name} fixture title`,
  metadata: { name },
  ...(id !== undefined && { id }),
});

const makeData = (list: string, rows: Prisma.InputJsonArray): Prisma.InputJsonObject => ({
  title: "Fixture section title",
  [list]: rows,
  unclassified: { isVisible: true },
});

describe("rowIdOf", () => {
  it("reads the non-empty string named by the registry", () => {
    expect(rowIdOf(FAQ_LIST, { id: "fixture-id" })).toBe("fixture-id");
    expect(rowIdOf({ ...FAQ_LIST, identity: "key" }, { id: "wrong", key: "right" })).toBe("right");
    expect(rowIdOf(FAQ_LIST, { id: " " })).toBe(" ");
  });

  it.each([undefined, null, "", 0, false, [], {}])(
    "ignores an absent, empty or non-string id %j",
    (id) => {
      expect(rowIdOf(FAQ_LIST, { id })).toBeUndefined();
    },
  );
});

describe("withEnglishRowIds", () => {
  it.each(LIST_CASES)(
    "gives a row of $section a fresh id and keeps its existing ids",
    ({ section, list }) => {
      const rows = [makeRow("First"), makeRow("Second", "kept-id")];
      const data = makeData(list, rows);
      const original = structuredClone(data);
      const result = withEnglishRowIds(section, data);

      expect(result).toEqual({
        ...data,
        [list]: [{ ...rows[0], id: expect.stringMatching(UUID) }, rows[1]],
      });
      expect(data).toEqual(original);
    },
  );

  it("mints distinct UUIDs for missing, empty and non-string ids without changing fields or order", () => {
    const ids = [undefined, "", null, 0, false, [], {}];
    const rows = ids.map((id, index) => makeRow(`Row ${index}`, id));
    const data = makeData("items", rows);
    const original = structuredClone(data);
    const result = withEnglishRowIds("faq:content", data);
    const minted = rowIdsSchema.parse(result.items).map((row) => row.id);

    expect(minted).toHaveLength(rows.length);
    expect(new Set(minted).size).toBe(rows.length);
    minted.forEach((id) => expect(id).toMatch(UUID));
    expect(result).toEqual({
      ...data,
      items: rows.map((row, index) => ({ ...row, id: minted[index] })),
    });
    expect(data).toEqual(original);
  });

  it.each(LIST_CASES)(
    "refuses a repeated non-empty id in $section with exact details without mutation",
    ({ section, list }) => {
      const data = makeData(list, [
        makeRow("Missing"),
        makeRow("First", "same-id"),
        makeRow("Second", "same-id"),
      ]);
      const original = structuredClone(data);
      const run = () => withEnglishRowIds(section, data);

      expect(run).toThrow(BadRequestError);
      expect(run).toThrowError(
        expect.objectContaining({
          message: "Two rows of the list share the id same-id",
          details: { section, list, id: "same-id" },
          statusCode: 400,
        }),
      );
      expect(data).toEqual(original);
    },
  );

  it("keeps a non-empty whitespace id exactly as supplied", () => {
    const data = makeData("items", [makeRow("First", " ")]);

    expect(withEnglishRowIds("faq:content", data)).toEqual(data);
  });

  it("leaves non-object elements in their positions", () => {
    const values = [null, false, 0, "text", ["nested"]];
    const row = makeRow("Object");
    const data = makeData("items", [...values, row]);

    expect(withEnglishRowIds("faq:content", data)).toEqual({
      ...data,
      items: [...values, { ...row, id: expect.stringMatching(UUID) }],
    });
  });

  it.each([undefined, null, false, 0, "text", {}])(
    "keeps a non-array list value %j unchanged",
    (items) => {
      const data = { items };

      expect(withEnglishRowIds("faq:content", data)).toEqual(data);
    },
  );

  it("keeps an empty list and does not create an absent list", () => {
    expect(withEnglishRowIds("faq:content", { items: [] })).toEqual({ items: [] });
    expect(withEnglishRowIds("faq:content", {})).toEqual({});
  });

  it("leaves a section without registered lists and unclassified arrays unchanged", () => {
    const data = { title: "Fixture title", items: [makeRow("Unclassified")] };

    expect(withEnglishRowIds("home:hero", data)).toEqual(data);
  });

  it("recurses through groups to a nested list without mutating the input", () => {
    const row = makeRow("Nested");
    const data = { fieldLabels: { nested: { items: [row] } }, retained: "Fixture retained value" };
    const original = structuredClone(data);

    expect(withEnglishRowIds("contact:form", data)).toEqual({
      ...data,
      fieldLabels: { nested: { items: [{ ...row, id: expect.stringMatching(UUID) }] } },
    });
    expect(data).toEqual(original);
  });

  it("refuses duplicated ids inside a nested group's list", () => {
    const items = [makeRow("First", "same-id"), makeRow("Second", "same-id")];

    expect(() =>
      withEnglishRowIds("contact:form", { fieldLabels: { nested: { items } } }),
    ).toThrowError(
      expect.objectContaining({
        details: { section: "contact:form", list: "items", id: "same-id" },
      }),
    );
  });

  it("allows the same id in separate lists", () => {
    const row = makeRow("Shared id", "same-id");
    const data = { fieldLabels: { nested: { items: [row], otherItems: [row] } } };

    expect(withEnglishRowIds("contact:form", data)).toEqual(data);
  });

  it("leaves a non-object group value unchanged", () => {
    expect(withEnglishRowIds("contact:form", { fieldLabels: null })).toEqual({ fieldLabels: null });
  });
});
