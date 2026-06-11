import {
  type SchemaGroup as PrismaSchemaGroup,
  type SchemaRow as PrismaSchemaRow,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";

import { mapToSchemaGroup } from "./schema-group.mapper";
import {
  mapSchemas,
  mapToSchema,
  mapToSchemaWithBody,
  type PrismaSchemaWithRows,
} from "./schema.mapper";

const NOW = new Date("2026-06-07T12:00:00Z");
const BLOCK_ID = "clz00000000000000000block1";
const GROUP_ID = "clz00000000000000000group1";

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

const makeFlatSchema = (overrides: {
  id: string;
  groupId?: string | null;
  order: number;
  header?: string | null;
  composition?: Composition | null;
  rows?: PrismaSchemaRow[];
}): PrismaSchemaWithRows => ({
  id: overrides.id,
  blockId: BLOCK_ID,
  groupId: overrides.groupId ?? null,
  order: overrides.order,
  header: overrides.header ?? null,
  composition: overrides.composition ?? null,
  intensity: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows: overrides.rows ?? [],
});

const makeExerciseRow = (id: string, schemaId: string, order: number): PrismaSchemaRow => ({
  id,
  schemaId,
  order,
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: id } },
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makePrismaGroup = (overrides: Partial<PrismaSchemaGroup>): PrismaSchemaGroup => ({
  id: GROUP_ID,
  blockId: BLOCK_ID,
  label: null,
  interleaveOrder: "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const LADDER_COMPOSITION: Composition = { repetition: { kind: "ladder", steps: [21, 15, 9] } };
const ROUNDS_COMPOSITION: Composition = { repetition: { kind: "count", count: 3 } };

describe("mapToSchema", () => {
  it("maps groupId straight through and never references a parent schema", () => {
    const mapped = mapToSchema(
      makeFlatSchema({ id: cuid("member"), groupId: GROUP_ID, order: 20 }),
    );

    expect(mapped.groupId).toBe(GROUP_ID);
    expect(mapped.order).toBe(20);
    expect(mapped).not.toHaveProperty("parentSchemaId");
    expect(mapped).not.toHaveProperty("subSchemas");
  });

  it("maps a null groupId to null for an ungrouped block-level schema", () => {
    const mapped = mapToSchema(makeFlatSchema({ id: cuid("solo"), groupId: null, order: 10 }));

    expect(mapped.groupId).toBeNull();
  });

  it("derives the composition label from repetition alone (no structure param)", () => {
    const mapped = mapToSchema(
      makeFlatSchema({ id: cuid("ladder"), order: 10, composition: LADDER_COMPOSITION }),
    );

    expect(mapped.composition).toEqual(LADDER_COMPOSITION);
    expect(mapped.label).toEqual(deriveCompositionLabel(LADDER_COMPOSITION));
  });

  it("returns a null label when composition is null", () => {
    const mapped = mapToSchema(
      makeFlatSchema({ id: cuid("nocomp"), order: 10, composition: null }),
    );

    expect(mapped.composition).toBeNull();
    expect(mapped.label).toBeNull();
  });
});

describe("mapToSchemaWithBody", () => {
  it("returns a flat { schema, rows } shape with no subSchemas field", () => {
    const schemaId = cuid("body");
    const node = mapToSchemaWithBody(
      makeFlatSchema({
        id: schemaId,
        order: 10,
        composition: ROUNDS_COMPOSITION,
        rows: [makeExerciseRow(cuid("rowone"), schemaId, 10)],
      }),
    );

    expect(node.schema.id).toBe(schemaId);
    expect(node.schema.label).toEqual(deriveCompositionLabel(ROUNDS_COMPOSITION));
    expect(node.rows.map((r) => r.id)).toEqual([cuid("rowone")]);
    expect(node).not.toHaveProperty("subSchemas");
  });
});

describe("mapSchemas", () => {
  it("returns a flat array sorted ascending by order with no nesting", () => {
    const later = cuid("later");
    const earlier = cuid("earlier");
    const middle = cuid("middle");

    const mapped = mapSchemas([
      makeFlatSchema({ id: later, order: 30 }),
      makeFlatSchema({ id: earlier, order: 10 }),
      makeFlatSchema({ id: middle, groupId: GROUP_ID, order: 20 }),
    ]);

    expect(mapped.map((s) => s.schema.id)).toEqual([earlier, middle, later]);
    expect(mapped.map((s) => s.schema.order)).toEqual([10, 20, 30]);
    expect(mapped.every((s) => !("subSchemas" in s))).toBe(true);
  });

  it("preserves each schema's rows sorted by the include order", () => {
    const schemaId = cuid("withrows");
    const mapped = mapSchemas([
      makeFlatSchema({
        id: schemaId,
        order: 10,
        rows: [
          makeExerciseRow(cuid("rowa"), schemaId, 10),
          makeExerciseRow(cuid("rowb"), schemaId, 20),
        ],
      }),
    ]);

    expect(mapped[0]?.rows.map((r) => r.id)).toEqual([cuid("rowa"), cuid("rowb")]);
  });

  it("returns an empty array for an empty flat list", () => {
    expect(mapSchemas([])).toEqual([]);
  });
});

describe("mapToSchemaGroup", () => {
  it("maps the group row and parses interleaveOrder", () => {
    const mapped = mapToSchemaGroup(
      makePrismaGroup({ label: "parallel ladders", interleaveOrder: "track_by_track" }),
    );

    expect(mapped).toEqual({
      id: GROUP_ID,
      blockId: BLOCK_ID,
      label: "parallel ladders",
      interleaveOrder: "track_by_track",
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it("carries a null label through", () => {
    const mapped = mapToSchemaGroup(makePrismaGroup({ label: null }));

    expect(mapped.label).toBeNull();
    expect(mapped.interleaveOrder).toBe("round_by_round");
  });
});
