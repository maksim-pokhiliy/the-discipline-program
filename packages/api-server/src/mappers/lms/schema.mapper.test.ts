import { type SchemaRow as PrismaSchemaRow } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type Composition } from "@repo/contracts/lms/composition";

import { buildSchemaForest, type PrismaSchemaWithRows } from "./schema.mapper";

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

const ROUNDS_COMPOSITION: Composition = { repetition: { kind: "count", count: 2 } };
const PARALLEL_COMPOSITION = (trackOne: string, trackTwo: string): Composition => ({
  arrangement: {
    kind: "parallel",
    interleaveOrder: "round_by_round",
    tracks: [{ childSchemaId: trackOne }, { childSchemaId: trackTwo }],
  },
});

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

  it("preserves the parallel arrangement track refs that resolve to the depth-3 ladder tracks (T1-3)", () => {
    const containerId = cuid("parallel");
    const trackOneId = cuid("trackone");
    const trackTwoId = cuid("tracktwo");

    const flat: PrismaSchemaWithRows[] = [
      makeFlatSchema({
        id: ROOT_ID,
        parentSchemaId: null,
        order: 10,
        composition: ROUNDS_COMPOSITION,
      }),
      makeFlatSchema({
        id: containerId,
        parentSchemaId: ROOT_ID,
        order: 10,
        composition: PARALLEL_COMPOSITION(trackOneId, trackTwoId),
      }),
      makeFlatSchema({
        id: trackOneId,
        parentSchemaId: containerId,
        order: 10,
        rows: [makeExerciseRow(cuid("rowone"), trackOneId)],
      }),
      makeFlatSchema({
        id: trackTwoId,
        parentSchemaId: containerId,
        order: 20,
        rows: [makeExerciseRow(cuid("rowtwo"), trackTwoId)],
      }),
    ];

    const forest = buildSchemaForest(flat);
    const container = forest[0]?.subSchemas[0];
    const arrangement = container?.schema.composition?.arrangement;

    expect(container?.subSchemas.map((s) => s.schema.id)).toEqual([trackOneId, trackTwoId]);
    expect(arrangement?.kind).toBe("parallel");

    if (arrangement?.kind !== "parallel") {
      return;
    }

    const trackRefs = arrangement.tracks.map((t) => t.childSchemaId);
    const builtTrackIds = container?.subSchemas.map((s) => s.schema.id) ?? [];

    expect(trackRefs.every((ref) => builtTrackIds.includes(ref))).toBe(true);
    expect(container?.subSchemas[0]?.rows[0]?.id).toBe(cuid("rowone"));
    expect(container?.subSchemas[1]?.rows[0]?.id).toBe(cuid("rowtwo"));
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
