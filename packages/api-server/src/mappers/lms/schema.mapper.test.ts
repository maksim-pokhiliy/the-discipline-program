import { type SchemaGroup as PrismaSchemaGroup } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";

import { mapToSchemaGroup } from "./schema-group.mapper";
import { mapToSchemaRow, type PrismaSchemaRowWithModifiers } from "./schema-row.mapper";
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
  rows?: PrismaSchemaRowWithModifiers[];
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
  rowGroups: [],
});

const makeExerciseRow = (
  id: string,
  schemaId: string,
  order: number,
): PrismaSchemaRowWithModifiers => ({
  id,
  schemaId,
  order,
  exerciseId: id,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  intensity: null,
  rest: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  modifierAssignments: [],
});

const makePrismaGroup = (overrides: Partial<PrismaSchemaGroup>): PrismaSchemaGroup => ({
  id: GROUP_ID,
  blockId: BLOCK_ID,
  notes: null,
  interleaveOrder: "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeModifier = (id: string, name: string) => ({
  id,
  name,
  nameLower: name.toLowerCase(),
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeRowWithModifiers = (
  id: string,
  schemaId: string,
  order: number,
  assignments: { modifierId: string; name: string; order: number }[],
): PrismaSchemaRowWithModifiers => ({
  ...makeExerciseRow(id, schemaId, order),
  modifierAssignments: assignments.map((a) => ({
    id: cuid(`asg${a.order}`),
    rowId: id,
    modifierId: a.modifierId,
    order: a.order,
    modifier: makeModifier(a.modifierId, a.name),
  })),
});

const LADDER_COMPOSITION: Composition = { repetition: { kind: "ladder", steps: [21, 15, 9] } };
const ROUNDS_COMPOSITION: Composition = { repetition: { kind: "count", count: 3 } };
const CAPPED_COMPOSITION: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
  cap: { min: 12, unit: "min" },
};

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

  it("round-trips a composition cap through the composition parse", () => {
    const mapped = mapToSchema(
      makeFlatSchema({ id: cuid("capped"), order: 10, composition: CAPPED_COMPOSITION }),
    );

    expect(mapped.composition).toEqual(CAPPED_COMPOSITION);
    expect(mapped.composition?.cap).toEqual({ min: 12, unit: "min" });
  });
});

describe("mapToSchemaRow", () => {
  it("parses intensity and rest value objects from the stored JSON", () => {
    const mapped = mapToSchemaRow({
      ...makeExerciseRow(cuid("vorow"), cuid("voschema"), 10),
      intensity: { rpe: { value: 8 } },
      rest: { duration: { value: 120, unit: "sec" }, scope: "between_sets" },
    });

    expect(mapped.intensity).toEqual({ rpe: { value: 8 } });
    expect(mapped.rest).toEqual({
      duration: { value: 120, unit: "sec" },
      scope: "between_sets",
    });
  });

  it("maps a null intensity and a null rest straight through", () => {
    const mapped = mapToSchemaRow(makeExerciseRow(cuid("nullvo"), cuid("voschema"), 10));

    expect(mapped.intensity).toBeNull();
    expect(mapped.rest).toBeNull();
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

  it("returns each row's modifiers sorted by assignment order (QA-#12)", () => {
    const schemaId = cuid("modbody");
    const node = mapToSchemaWithBody(
      makeFlatSchema({
        id: schemaId,
        order: 10,
        rows: [
          makeRowWithModifiers(cuid("rowmod"), schemaId, 10, [
            { modifierId: cuid("modb"), name: "neutral grip", order: 1 },
            { modifierId: cuid("moda"), name: "from sofa", order: 0 },
          ]),
        ],
      }),
    );

    expect(node.rows[0]?.modifiers.map((m) => m.id)).toEqual([cuid("moda"), cuid("modb")]);
    expect(node.rows[0]?.modifiers.map((m) => m.name)).toEqual(["from sofa", "neutral grip"]);
  });

  it("returns the schema's rowGroups embed mapped from Prisma rows (QA-#12, DR-W4-SWB)", () => {
    const schemaId = cuid("rgbody");
    const node = mapToSchemaWithBody({
      ...makeFlatSchema({ id: schemaId, order: 10 }),
      rowGroups: [
        {
          id: cuid("rg1"),
          schemaId,
          notes: ["OR"],
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });

    expect(node.rowGroups).toHaveLength(1);
    expect(node.rowGroups[0]?.id).toBe(cuid("rg1"));
    expect(node.rowGroups[0]?.schemaId).toBe(schemaId);
    expect(node.rowGroups[0]?.notes).toEqual(["OR"]);
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
      makePrismaGroup({ notes: ["parallel ladders"], interleaveOrder: "track_by_track" }),
    );

    expect(mapped).toEqual({
      id: GROUP_ID,
      blockId: BLOCK_ID,
      notes: ["parallel ladders"],
      interleaveOrder: "track_by_track",
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it("carries a null notes value through", () => {
    const mapped = mapToSchemaGroup(makePrismaGroup({ notes: null }));

    expect(mapped.notes).toBeNull();
    expect(mapped.interleaveOrder).toBe("round_by_round");
  });
});
