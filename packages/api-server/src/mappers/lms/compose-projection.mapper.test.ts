import { describe, expect, it } from "vitest";

import { type Composition } from "@repo/contracts/lms/composition";
import { type Schema, type SchemaWithBody } from "@repo/contracts/lms/schema";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import { BadRequestError, InternalServerError } from "@repo/errors";

import {
  assertComposeTreeValid,
  assertComposeTreeValidForWrite,
  projectSchemaWithBody,
} from "./compose-projection.mapper";

const cuidFran = "clz000000000000000000fran";
const cuidThrusters = "clz00000000000000000thrust";
const cuidPullups = "clz00000000000000000pullup";
const cuidNullNode = "clz0000000000000000nullnod";
const cuidBlock = "clz00000000000000000block1";
const cuidGroup = "clz00000000000000000group1";
const cuidRestSlotRow = "clz000000000000000restslot";

const NOW = new Date("2026-06-03T12:00:00Z");

const makeSchema = (overrides: Partial<Schema>): Schema => ({
  id: cuidFran,
  blockId: cuidBlock,
  groupId: null,
  order: 10,
  header: null,
  intensity: null,
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
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeRestSlotRow = (id: string): SchemaRow => ({
  id,
  schemaId: cuidFran,
  order: 20,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
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

const franComposition: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
};

const franNode: SchemaWithBody = {
  schema: makeSchema({ id: cuidFran, header: "Fran", composition: franComposition }),
  rows: [makeExerciseRow(cuidThrusters), makeExerciseRow(cuidPullups)],
};

const groupedMemberNode: SchemaWithBody = {
  schema: makeSchema({
    id: cuidFran,
    groupId: cuidGroup,
    header: "Track A",
    composition: { repetition: { kind: "ladder", steps: [9, 6, 3] } },
  }),
  rows: [makeExerciseRow(cuidThrusters)],
};

const restCompositionNode: SchemaWithBody = {
  schema: makeSchema({
    id: cuidFran,
    header: "EMOM",
    composition: {
      repetition: { kind: "cadence", everyMin: 1, rounds: 12 },
      rest: { duration: { value: 30, unit: "sec" }, scope: "between_sets" },
    },
  }),
  rows: [makeRestSlotRow(cuidRestSlotRow)],
};

const nullCompositionNode: SchemaWithBody = {
  schema: makeSchema({ id: cuidNullNode, header: null, composition: null }),
  rows: [makeExerciseRow(cuidThrusters)],
};

const malformedLadderNode: SchemaWithBody = {
  schema: makeSchema({
    id: cuidFran,
    header: "Malformed",
    composition: { repetition: { kind: "ladder", steps: [] } } as Composition,
  }),
  rows: [makeExerciseRow(cuidThrusters)],
};

describe("projectSchemaWithBody", () => {
  it("projects a valid flat container with row children only and drops the legacy Schema fields", () => {
    expect(() => assertComposeTreeValid(franNode)).not.toThrow();

    const projected = projectSchemaWithBody(franNode);

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
    expect(projected).not.toHaveProperty("groupId");
    expect(projected).not.toHaveProperty("createdAt");
  });

  it("projects a group member schema the same as any other flat container (groupId is not part of the tree)", () => {
    expect(() => assertComposeTreeValid(groupedMemberNode)).not.toThrow();

    const projected = projectSchemaWithBody(groupedMemberNode);

    expect(projected.nodeType).toBe("container");
    expect(projected).not.toHaveProperty("groupId");
    expect(projected.children).toHaveLength(1);
    expect(projected.children[0]?.id).toBe(cuidThrusters);
  });

  it("carries the rest axis through onto the projected container composition", () => {
    const projected = projectSchemaWithBody(restCompositionNode);

    expect(projected.composition).toEqual({
      repetition: { kind: "cadence", everyMin: 1, rounds: 12 },
      rest: { duration: { value: 30, unit: "sec" }, scope: "between_sets" },
    });
    expect(() => assertComposeTreeValid(restCompositionNode)).not.toThrow();
  });

  it("lifts a null per-node composition to an empty-but-valid bundle and validates", () => {
    const projected = projectSchemaWithBody(nullCompositionNode);

    expect(projected.composition).toEqual({});
    expect(() => assertComposeTreeValid(nullCompositionNode)).not.toThrow();
  });
});

describe("assertComposeTreeValid", () => {
  it("throws an InternalServerError with DbCorruption detail on a malformed composition", () => {
    expect(() => assertComposeTreeValid(malformedLadderNode)).toThrow(InternalServerError);

    try {
      assertComposeTreeValid(malformedLadderNode);
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
});

describe("assertComposeTreeValidForWrite", () => {
  it("throws BadRequestError (400) on a malformed composition", () => {
    expect(() => assertComposeTreeValidForWrite(malformedLadderNode)).toThrow(BadRequestError);

    try {
      assertComposeTreeValidForWrite(malformedLadderNode);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);

      if (error instanceof BadRequestError) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Schema composition tree is invalid");
        expect(error.details?.kind).toBeUndefined();
        expect(error.details?.entity).toBe("Schema");
        expect(Array.isArray(error.details?.issues)).toBe(true);
      }
    }
  });

  it("accepts a well-formed flat ladder container on the write path", () => {
    expect(() => assertComposeTreeValidForWrite(franNode)).not.toThrow();
  });
});
