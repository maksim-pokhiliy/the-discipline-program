import { describe, expect, it } from "vitest";

import type { AlternatingGroup } from "@repo/contracts/lms/alternating-group";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { groupSchemasByAltGroup } from "./group-schemas-by-alt-group";

const now = new Date("2025-01-06T00:00:00Z");

const DEFAULT_BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const DEFAULT_ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";

type SchemaFields = SchemaWithBody["schema"];

const makeSchema = (overrides: Partial<SchemaFields> = {}): SchemaWithBody => ({
  schema: {
    id: "clp9z8x7w0000abcd1234sch1",
    blockId: DEFAULT_BLOCK_ID,
    parentSchemaId: null,
    alternatingGroupId: null,
    order: 10,
    kind: "ATOMIC",
    archetypeId: DEFAULT_ARCHETYPE_ID,
    header: null,
    archetypeParams: { archetype: "amrap-flat", params: { durationMin: 10 } },
    intensity: null,
    trailingConnector: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  },
  rows: [],
  subSchemas: [],
});

const makeAltGroup = (overrides: Partial<AlternatingGroup> = {}): AlternatingGroup => ({
  id: "clp9z8x7w0000abcd1234ag01",
  blockId: DEFAULT_BLOCK_ID,
  relationKind: "ALTERNATING_SETS",
  schemaIds: ["clp9z8x7w0000abcd1234sch1", "clp9z8x7w0000abcd1234sch2"],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe("groupSchemasByAltGroup", () => {
  it("returns empty array when both inputs empty", () => {
    expect(groupSchemasByAltGroup([], [])).toEqual([]);
  });

  it("returns standalone schema kinds when no schema has alternatingGroupId", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1" });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2" });

    const out = groupSchemasByAltGroup([s1, s2], []);

    expect(out).toEqual([
      { kind: "schema", schema: s1 },
      { kind: "schema", schema: s2 },
    ]);
  });

  it("groups two adjacent schemas sharing an alternatingGroupId into a single alt entry", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: groupId });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id, s2.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2], [group]);

    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ kind: "alt", group, schemas: [s1, s2] });
  });

  it("emits the alt entry at the index of the first member", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: null });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: groupId });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id, s3.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2, s3], [group]);

    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ kind: "alt", group, schemas: [s1, s3] });
    expect(out[1]).toEqual({ kind: "schema", schema: s2 });
  });

  it("preserves declared sub-array order inside the alt entry", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: groupId });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id, s3.schema.id] });

    const out = groupSchemasByAltGroup([s1, s3], [group]);

    expect(out).toHaveLength(1);
    const first = out[0];

    if (first === undefined || first.kind !== "alt") {
      throw new Error("expected alt entry");
    }

    expect(first.schemas.map((s) => s.schema.id)).toEqual([
      "clp9z8x7w0000abcd1234sch1",
      "clp9z8x7w0000abcd1234sch3",
    ]);
  });

  it("falls back to standalone schema kind when alternatingGroupId is set but the group is missing from groups", () => {
    const orphanGroupId = "clp9z8x7w0000abcd1234agXX";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: orphanGroupId });

    const out = groupSchemasByAltGroup([s1], []);

    expect(out).toEqual([{ kind: "schema", schema: s1 }]);
  });

  it("handles a schema with alternatingGroupId=null among grouped siblings", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: null });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: groupId });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id, s3.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2, s3], [group]);

    expect(out.map((g) => g.kind)).toEqual(["alt", "schema"]);
    const standalone = out[1];

    if (standalone === undefined || standalone.kind !== "schema") {
      throw new Error("expected standalone schema entry");
    }

    expect(standalone.schema).toBe(s2);
  });

  it("does not duplicate group entries when iterating past members already grouped", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: groupId });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: groupId });
    const group = makeAltGroup({
      id: groupId,
      schemaIds: [s1.schema.id, s2.schema.id, s3.schema.id],
    });

    const out = groupSchemasByAltGroup([s1, s2, s3], [group]);

    expect(out).toHaveLength(1);
    expect(out.filter((g) => g.kind === "alt")).toHaveLength(1);
  });

  it("preserves SortableContext-friendly stable keys", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: groupId });
    const standalone = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: null });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id, s2.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2, standalone], [group]);

    expect(out).toHaveLength(2);
    const altEntry = out[0];
    const schemaEntry = out[1];

    if (altEntry === undefined || altEntry.kind !== "alt") {
      throw new Error("expected alt entry at index 0");
    }

    if (schemaEntry === undefined || schemaEntry.kind !== "schema") {
      throw new Error("expected schema entry at index 1");
    }

    expect(altEntry.group.id).toBe(groupId);
    expect(schemaEntry.schema.schema.id).toBe("clp9z8x7w0000abcd1234sch3");
  });

  it("preserves first-occurrence order across interleaved alt-groups (QA-Gap-A)", () => {
    const groupAId = "clp9z8x7w0000abcd1234aga1";
    const groupBId = "clp9z8x7w0000abcd1234agb1";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupAId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: groupBId });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd1234sch3", alternatingGroupId: groupAId });
    const s4 = makeSchema({ id: "clp9z8x7w0000abcd1234sch4", alternatingGroupId: groupBId });
    const groupA = makeAltGroup({ id: groupAId, schemaIds: [s1.schema.id, s3.schema.id] });
    const groupB = makeAltGroup({ id: groupBId, schemaIds: [s2.schema.id, s4.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2, s3, s4], [groupA, groupB]);

    expect(out).toHaveLength(2);

    const first = out[0];
    const second = out[1];

    if (first === undefined || first.kind !== "alt") {
      throw new Error("expected alt entry at index 0");
    }

    if (second === undefined || second.kind !== "alt") {
      throw new Error("expected alt entry at index 1");
    }

    expect(first.group.id).toBe(groupAId);
    expect(first.schemas.map((s) => s.schema.id)).toEqual([s1.schema.id, s3.schema.id]);
    expect(second.group.id).toBe(groupBId);
    expect(second.schemas.map((s) => s.schema.id)).toEqual([s2.schema.id, s4.schema.id]);
  });

  it("degrades to standalone when alt-group has only one matching member in schemas (QA-004)", () => {
    const groupId = "clp9z8x7w0000abcd1234ag01";
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234sch1", alternatingGroupId: groupId });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234sch2", alternatingGroupId: null });
    const group = makeAltGroup({ id: groupId, schemaIds: [s1.schema.id] });

    const out = groupSchemasByAltGroup([s1, s2], [group]);

    expect(out).toEqual([
      { kind: "schema", schema: s1 },
      { kind: "schema", schema: s2 },
    ]);
  });
});
