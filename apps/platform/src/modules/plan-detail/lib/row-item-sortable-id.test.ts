import { describe, expect, it } from "vitest";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { rowGroupSortableId, rowItemSortableId, rowSortableId } from "./row-item-sortable-id";

const ROW_ID = "clp9z8x7w0000abcd12rl1r001";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeRow = (): SchemaRow => ({
  id: ROW_ID,
  schemaId: "clp9z8x7w0000abcd1234sch1",
  order: 1,
  exerciseId: "clp9z8x7w0000abcd1234ex001",
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeRowGroup = (): RowGroup => ({
  id: GROUP_ID,
  schemaId: "clp9z8x7w0000abcd1234sch1",
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

describe("row item sortable ids", () => {
  it("prefixes a row id with its kind", () => {
    expect(rowSortableId(ROW_ID)).toBe(`row:${ROW_ID}`);
  });

  it("prefixes a row-group id with its kind", () => {
    expect(rowGroupSortableId(GROUP_ID)).toBe(`rowgroup:${GROUP_ID}`);
  });

  it("derives a row item id from a standalone row", () => {
    expect(rowItemSortableId({ kind: "row", row: makeRow() })).toBe(`row:${ROW_ID}`);
  });

  it("derives a row item id from a row-group box", () => {
    expect(rowItemSortableId({ kind: "group", group: makeRowGroup(), members: [makeRow()] })).toBe(
      `rowgroup:${GROUP_ID}`,
    );
  });
});
