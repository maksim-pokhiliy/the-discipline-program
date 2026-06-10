import { type SchemaRow as PrismaSchemaRow } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Composition, type CompositionLabel } from "@repo/contracts/lms/composition";
import { InternalServerError } from "@repo/errors";

import { buildSchemaForest, buildSchemaSubtree, type PrismaSchemaWithRows } from "./schema.mapper";

const NOW = new Date("2026-06-07T12:00:00Z");
const BLOCK_ID = "clz00000000000000000block1";

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

const makeFlatSchema = (overrides: {
  id: string;
  parentSchemaId: string | null;
  order: number;
  composition?: Composition | null;
  rows?: PrismaSchemaRow[];
}): PrismaSchemaWithRows => ({
  id: overrides.id,
  blockId: BLOCK_ID,
  parentSchemaId: overrides.parentSchemaId,
  order: overrides.order,
  header: null,
  composition: overrides.composition ?? null,
  intensity: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  rows: overrides.rows ?? [],
});

const makeExerciseRow = (id: string, schemaId: string): PrismaSchemaRow => ({
  id,
  schemaId,
  order: 10,
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
  compoundRep: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const ROOT_ID = cuid("root");
const CHILD_ID = cuid("child");
const GRANDCHILD_ID = cuid("grand");

const OUTER_ID = cuid("outer");
const MIDDLE_ID = cuid("middle");
const TRACK_ONE_ID = cuid("trackone");
const TRACK_TWO_ID = cuid("tracktwo");
const TRACK_ONE_ROW_ID = cuid("rowone");
const TRACK_TWO_ROW_ID = cuid("rowtwo");

const ROUNDS_COMPOSITION: Composition = { repetition: { kind: "count", count: 2 } };
const PARALLEL_PARENT_COMPOSITION: Composition = {};
const EMOM_COMPOSITION: Composition = { repetition: { kind: "cadence", everyMin: 1, rounds: 12 } };
const LADDER_COMPOSITION = (steps: number[]): Composition => ({
  repetition: { kind: "ladder", steps },
});

const ROUNDS_LABEL: CompositionLabel = { kind: "rounds", family: "ROUNDS" };
const PARALLEL_LABEL: CompositionLabel = { kind: "parallel", family: "PARALLEL" };
const LADDER_LABEL: CompositionLabel = { kind: "ladder", family: "LADDER" };
const CADENCE_LABEL: CompositionLabel = { kind: "cadence", family: "INTERVALIC" };

const makeDepth3ParallelFlat = (): PrismaSchemaWithRows[] => [
  makeFlatSchema({
    id: OUTER_ID,
    parentSchemaId: null,
    order: 10,
    composition: ROUNDS_COMPOSITION,
  }),
  makeFlatSchema({
    id: MIDDLE_ID,
    parentSchemaId: OUTER_ID,
    order: 10,
    composition: PARALLEL_PARENT_COMPOSITION,
  }),
  makeFlatSchema({
    id: TRACK_ONE_ID,
    parentSchemaId: MIDDLE_ID,
    order: 10,
    composition: LADDER_COMPOSITION([9, 6, 3]),
    rows: [makeExerciseRow(TRACK_ONE_ROW_ID, TRACK_ONE_ID)],
  }),
  makeFlatSchema({
    id: TRACK_TWO_ID,
    parentSchemaId: MIDDLE_ID,
    order: 20,
    composition: LADDER_COMPOSITION([3, 6, 9]),
    rows: [makeExerciseRow(TRACK_TWO_ROW_ID, TRACK_TWO_ID)],
  }),
];

describe("buildSchemaForest", () => {
  it("rebuilds a depth-3 tree without truncating level 3 (T1-3)", () => {
    const flat: PrismaSchemaWithRows[] = [
      makeFlatSchema({ id: ROOT_ID, parentSchemaId: null, order: 10 }),
      makeFlatSchema({ id: CHILD_ID, parentSchemaId: ROOT_ID, order: 10 }),
      makeFlatSchema({
        id: GRANDCHILD_ID,
        parentSchemaId: CHILD_ID,
        order: 10,
        rows: [makeExerciseRow(cuid("grandrow"), GRANDCHILD_ID)],
      }),
    ];

    const forest = buildSchemaForest(flat);

    expect(forest).toHaveLength(1);

    const root = forest[0];

    expect(root?.schema.id).toBe(ROOT_ID);
    expect(root?.schema.label).toBeNull();
    expect(root?.subSchemas).toHaveLength(1);

    const child = root?.subSchemas[0];

    expect(child?.schema.id).toBe(CHILD_ID);
    expect(child?.subSchemas).toHaveLength(1);

    const grandchild = child?.subSchemas[0];

    expect(grandchild?.schema.id).toBe(GRANDCHILD_ID);
    expect(grandchild?.rows).toHaveLength(1);
    expect(grandchild?.rows[0]?.id).toBe(cuid("grandrow"));
    expect(grandchild?.subSchemas).toEqual([]);
  });

  it("derives structural labels at every depth of a rounds → parallel → ladder tree", () => {
    const forest = buildSchemaForest(makeDepth3ParallelFlat());

    expect(forest).toHaveLength(1);

    const outer = forest[0];

    expect(outer?.schema.id).toBe(OUTER_ID);
    expect(outer?.schema.label).toEqual(ROUNDS_LABEL);

    const middle = outer?.subSchemas[0];

    expect(middle?.schema.id).toBe(MIDDLE_ID);
    expect(middle?.schema.label).toEqual(PARALLEL_LABEL);
    expect(middle?.subSchemas.map((s) => s.schema.id)).toEqual([TRACK_ONE_ID, TRACK_TWO_ID]);
    expect(middle?.subSchemas.map((s) => s.schema.label)).toEqual([LADDER_LABEL, LADDER_LABEL]);
    expect(middle?.subSchemas[0]?.rows[0]?.id).toBe(TRACK_ONE_ROW_ID);
    expect(middle?.subSchemas[1]?.rows[0]?.id).toBe(TRACK_TWO_ROW_ID);
  });

  it("labels a cadence parent with container children as cadence, not parallel", () => {
    const emomId = cuid("emom");
    const flat: PrismaSchemaWithRows[] = [
      makeFlatSchema({
        id: emomId,
        parentSchemaId: null,
        order: 10,
        composition: EMOM_COMPOSITION,
      }),
      makeFlatSchema({ id: cuid("slotone"), parentSchemaId: emomId, order: 10 }),
      makeFlatSchema({ id: cuid("slottwo"), parentSchemaId: emomId, order: 20 }),
      makeFlatSchema({ id: cuid("slotthree"), parentSchemaId: emomId, order: 30 }),
    ];

    const forest = buildSchemaForest(flat);

    expect(forest[0]?.schema.label).toEqual(CADENCE_LABEL);
    expect(forest[0]?.subSchemas).toHaveLength(3);
  });

  it("orders children by order at every level and roots by order", () => {
    const rootEarly = cuid("rootearly");
    const rootLate = cuid("rootlate");
    const childEarly = cuid("childearly");
    const childLate = cuid("childlate");

    const flat: PrismaSchemaWithRows[] = [
      makeFlatSchema({ id: rootLate, parentSchemaId: null, order: 20 }),
      makeFlatSchema({ id: rootEarly, parentSchemaId: null, order: 10 }),
      makeFlatSchema({ id: childLate, parentSchemaId: rootEarly, order: 20 }),
      makeFlatSchema({ id: childEarly, parentSchemaId: rootEarly, order: 10 }),
    ];

    const forest = buildSchemaForest(flat);

    expect(forest.map((s) => s.schema.id)).toEqual([rootEarly, rootLate]);
    expect(forest[0]?.subSchemas.map((s) => s.schema.id)).toEqual([childEarly, childLate]);
  });

  it("returns an empty forest for an empty flat list", () => {
    expect(buildSchemaForest([])).toEqual([]);
  });

  it("returns a single childless root with empty subSchemas", () => {
    const forest = buildSchemaForest([
      makeFlatSchema({ id: ROOT_ID, parentSchemaId: null, order: 10 }),
    ]);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.schema.id).toBe(ROOT_ID);
    expect(forest[0]?.subSchemas).toEqual([]);
  });

  it("rebuilds multiple roots of mixed depth without cross-subtree leakage", () => {
    const rootA = cuid("roota");
    const rootB = cuid("rootb");
    const childA = cuid("childa");
    const grandchildA = cuid("grandchilda");

    const flat: PrismaSchemaWithRows[] = [
      makeFlatSchema({ id: rootA, parentSchemaId: null, order: 10 }),
      makeFlatSchema({ id: rootB, parentSchemaId: null, order: 20 }),
      makeFlatSchema({ id: childA, parentSchemaId: rootA, order: 10 }),
      makeFlatSchema({ id: grandchildA, parentSchemaId: childA, order: 10 }),
    ];

    const forest = buildSchemaForest(flat);

    expect(forest.map((s) => s.schema.id)).toEqual([rootA, rootB]);
    expect(forest[1]?.subSchemas).toEqual([]);
    expect(forest[0]?.subSchemas[0]?.schema.id).toBe(childA);
    expect(forest[0]?.subSchemas[0]?.subSchemas[0]?.schema.id).toBe(grandchildA);
  });
});

describe("buildSchemaSubtree", () => {
  it("projects the full-depth subtree from the outer root including the grandchild level", () => {
    const subtree = buildSchemaSubtree(makeDepth3ParallelFlat(), OUTER_ID);

    expect(subtree.schema.id).toBe(OUTER_ID);
    expect(subtree.schema.label).toEqual(ROUNDS_LABEL);

    const middle = subtree.subSchemas[0];

    expect(middle?.schema.id).toBe(MIDDLE_ID);
    expect(middle?.schema.label).toEqual(PARALLEL_LABEL);
    expect(middle?.subSchemas.map((s) => s.schema.id)).toEqual([TRACK_ONE_ID, TRACK_TWO_ID]);
    expect(middle?.subSchemas.map((s) => s.schema.label)).toEqual([LADDER_LABEL, LADDER_LABEL]);
    expect(middle?.subSchemas[0]?.rows[0]?.id).toBe(TRACK_ONE_ROW_ID);
  });

  it("projects a mid-tree root with its track children and without the outer level", () => {
    const subtree = buildSchemaSubtree(makeDepth3ParallelFlat(), MIDDLE_ID);

    expect(subtree.schema.id).toBe(MIDDLE_ID);
    expect(subtree.schema.label).toEqual(PARALLEL_LABEL);
    expect(subtree.subSchemas.map((s) => s.schema.id)).toEqual([TRACK_ONE_ID, TRACK_TWO_ID]);
    expect(subtree.subSchemas[1]?.rows[0]?.id).toBe(TRACK_TWO_ROW_ID);
  });

  it("projects a leaf root with its rows and empty subSchemas", () => {
    const subtree = buildSchemaSubtree(makeDepth3ParallelFlat(), TRACK_ONE_ID);

    expect(subtree.schema.id).toBe(TRACK_ONE_ID);
    expect(subtree.schema.label).toEqual(LADDER_LABEL);
    expect(subtree.rows.map((r) => r.id)).toEqual([TRACK_ONE_ROW_ID]);
    expect(subtree.subSchemas).toEqual([]);
  });

  it("throws an InternalServerError with DbCorruption detail when the root id is missing", () => {
    const missingId = cuid("missing");
    const flat = makeDepth3ParallelFlat();

    expect(() => buildSchemaSubtree(flat, missingId)).toThrow(InternalServerError);

    try {
      buildSchemaSubtree(flat, missingId);
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerError);

      if (error instanceof InternalServerError) {
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Schema subtree root not found");
        expect(error.details?.kind).toBe("DbCorruption");
        expect(error.details?.entity).toBe("Schema");
        expect(error.details?.schemaId).toBe(missingId);
      }
    }
  });
});
