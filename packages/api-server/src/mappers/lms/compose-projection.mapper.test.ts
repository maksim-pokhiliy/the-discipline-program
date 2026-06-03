import { describe, expect, it } from "vitest";

import { type Composition } from "@repo/contracts/lms/composition";
import { type Schema, type SchemaWithBody } from "@repo/contracts/lms/schema";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import { InternalServerError } from "@repo/errors";

import { assertComposeTreeValid, projectSchemaWithBody } from "./compose-projection.mapper";

const cuidFran = "clz000000000000000000fran";
const cuidThrusters = "clz00000000000000000thrust";
const cuidPullups = "clz00000000000000000pullup";
const cuidMarkerRow = "clz0000000000000markerrow1";
const cuidNullNode = "clz0000000000000000nullnod";
const cuidBlock = "clz00000000000000000block1";
const cuidArchetype = "clz0000000000000archetype1";
const cuidOuter = "clz0000000000000000outer01";
const cuidInnerLadder = "clz0000000000000innerladd1";
const cuidSuperset = "clz0000000000000superset01";
const cuidDangA = "clz0000000000000danglinga1";
const cuidDangB = "clz0000000000000danglingb1";

const NOW = new Date("2026-06-03T12:00:00Z");

const makeSchema = (overrides: Partial<Schema>): Schema => ({
  id: cuidFran,
  blockId: cuidBlock,
  parentSchemaId: null,
  alternatingGroupId: null,
  order: 10,
  kind: "ATOMIC",
  archetypeId: cuidArchetype,
  header: null,
  archetypeParams: { archetype: "single-line-bare", params: {} },
  intensity: null,
  trailingConnector: null,
  composition: null,
  label: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeExerciseRow = (id: string): SchemaRow => ({
  id,
  schemaId: cuidFran,
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

const makeLadderMarkerRow = (id: string, steps: number[]): SchemaRow => ({
  id,
  schemaId: cuidFran,
  order: 10,
  rowKind: "INNER_LADDER_MARKER",
  rowPayload: { rowKind: "INNER_LADDER_MARKER", steps },
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

const franComposition: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
  arrangement: { kind: "ordered" },
};

const franNode: SchemaWithBody = {
  schema: makeSchema({ id: cuidFran, header: "Fran", composition: franComposition }),
  rows: [makeExerciseRow(cuidThrusters), makeExerciseRow(cuidPullups)],
  subSchemas: [],
};

const collisionNode: SchemaWithBody = {
  schema: makeSchema({
    id: cuidFran,
    header: "Collision",
    composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
  }),
  rows: [makeLadderMarkerRow(cuidMarkerRow, [21, 15, 9])],
  subSchemas: [],
};

const nullCompositionNode: SchemaWithBody = {
  schema: makeSchema({ id: cuidNullNode, header: null, composition: null }),
  rows: [makeExerciseRow(cuidThrusters)],
  subSchemas: [],
};

const nestedLadderCollisionNode: SchemaWithBody = {
  schema: makeSchema({ id: cuidOuter, header: "Outer", composition: {} }),
  rows: [],
  subSchemas: [
    {
      schema: makeSchema({
        id: cuidInnerLadder,
        header: "Inner ladder",
        composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      }),
      rows: [makeLadderMarkerRow(cuidMarkerRow, [21, 15, 9])],
      subSchemas: [],
    },
  ],
};

const danglingSupersetNode: SchemaWithBody = {
  schema: makeSchema({
    id: cuidSuperset,
    header: "Superset",
    composition: {
      arrangement: { kind: "superset", pairs: [{ label: "A", rowIds: [cuidDangA, cuidDangB] }] },
    },
  }),
  rows: [makeExerciseRow(cuidThrusters), makeExerciseRow(cuidPullups)],
  subSchemas: [],
};

describe("projectSchemaWithBody", () => {
  it("projects a valid ladder container without throwing and drops the legacy Schema fields", () => {
    expect(() => assertComposeTreeValid(franNode)).not.toThrow();

    const projected = projectSchemaWithBody(franNode);

    expect(projected.nodeType).toBe("container");

    if (projected.nodeType !== "container") {
      return;
    }

    expect(projected).toEqual({
      nodeType: "container",
      id: cuidFran,
      header: "Fran",
      notes: null,
      composition: franComposition,
      children: [
        {
          nodeType: "row",
          id: cuidThrusters,
          rowKind: "EXERCISE",
          rowPayload: {
            rowKind: "EXERCISE",
            exercise: { form: "atomic", exerciseId: cuidThrusters },
          },
          reps: null,
          load: null,
          side: null,
          tempo: null,
          position: null,
          intensity: null,
          notes: null,
        },
        {
          nodeType: "row",
          id: cuidPullups,
          rowKind: "EXERCISE",
          rowPayload: {
            rowKind: "EXERCISE",
            exercise: { form: "atomic", exerciseId: cuidPullups },
          },
          reps: null,
          load: null,
          side: null,
          tempo: null,
          position: null,
          intensity: null,
          notes: null,
        },
      ],
    });

    expect(projected.children).toHaveLength(2);
    expect(projected).not.toHaveProperty("schemaId");
    expect(projected).not.toHaveProperty("archetypeParams");
    expect(projected).not.toHaveProperty("createdAt");
  });

  it("lifts a null per-node composition to an empty-but-valid bundle and validates", () => {
    const projected = projectSchemaWithBody(nullCompositionNode);

    expect(projected.nodeType).toBe("container");

    if (projected.nodeType !== "container") {
      return;
    }

    expect(projected.composition).toEqual({});
    expect(() => assertComposeTreeValid(nullCompositionNode)).not.toThrow();
  });
});

describe("assertComposeTreeValid", () => {
  it("throws an InternalServerError with DbCorruption detail on a ladder collision", () => {
    expect(() => assertComposeTreeValid(collisionNode)).toThrow(InternalServerError);

    try {
      assertComposeTreeValid(collisionNode);
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerError);

      if (error instanceof InternalServerError) {
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Schema composition tree failed validation");
        expect(error.details?.kind).toBe("DbCorruption");
        expect(error.details?.entity).toBe("Schema");
        expect(Array.isArray(error.details?.issues)).toBe(true);
      }
    }
  });

  it("surfaces a row-child collision on a ladder container nested at depth 2 (the marker is always a row child)", () => {
    expect(() => assertComposeTreeValid(nestedLadderCollisionNode)).toThrow(InternalServerError);

    const innerLadder = nestedLadderCollisionNode.subSchemas[0];

    expect(innerLadder?.schema.composition?.repetition?.kind).toBe("ladder");
    expect(innerLadder?.rows[0]?.rowKind).toBe("INNER_LADDER_MARKER");
  });

  it("flattens rows and sub-schemas into one children array, so a row marker collides regardless of slot", () => {
    const projectedInner = projectSchemaWithBody({
      schema: makeSchema({
        id: cuidInnerLadder,
        composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      }),
      rows: [makeLadderMarkerRow(cuidMarkerRow, [21, 15, 9])],
      subSchemas: [],
    });

    expect(projectedInner.nodeType).toBe("container");

    if (projectedInner.nodeType !== "container") {
      return;
    }

    expect(projectedInner.children).toHaveLength(1);
    expect(projectedInner.children[0]?.nodeType).toBe("row");

    const markerChild = projectedInner.children[0];

    expect(markerChild?.nodeType === "row" && markerChild.rowPayload.rowKind).toBe(
      "INNER_LADDER_MARKER",
    );
  });
});

describe("assertComposeTreeValid — arrangement reference existence is NOT validated (QA-004)", () => {
  it("projects and validates a superset whose rowIds reference non-existent rows without throwing", () => {
    expect(() => assertComposeTreeValid(danglingSupersetNode)).not.toThrow();

    const projected = projectSchemaWithBody(danglingSupersetNode);

    expect(projected.nodeType).toBe("container");

    if (projected.nodeType !== "container") {
      return;
    }

    expect(projected.composition.arrangement?.kind).toBe("superset");

    if (projected.composition.arrangement?.kind !== "superset") {
      return;
    }

    expect(projected.composition.arrangement.pairs[0]?.rowIds).toEqual([cuidDangA, cuidDangB]);
    expect(projected.children.some((child) => child.id === cuidDangA)).toBe(false);
    expect(projected.children.some((child) => child.id === cuidDangB)).toBe(false);
  });
});
