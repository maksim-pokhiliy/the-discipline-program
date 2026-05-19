import { describe, expect, it } from "vitest";

import { POSITIONS, ROW_KINDS } from "./schema-row.constants";
import {
  createSchemaRowSchema,
  footnoteMarkerSchema,
  positionSchema,
  reorderSchemaRowsSchema,
  rowKindSchema,
  schemaRowPayloadSchema,
  schemaRowSchema,
  updateSchemaRowSchema,
  urlAppliesToSchema,
} from "./schema-row.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const exercisePayload = {
  rowKind: "EXERCISE" as const,
  exercise: { form: "atomic" as const, exerciseId: cuidA },
};

const baseRow = {
  id: cuidA,
  schemaId: cuidB,
  order: 1,
  rowKind: "EXERCISE" as const,
  rowPayload: exercisePayload,
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("rowKindSchema", () => {
  for (const k of ROW_KINDS) {
    it(`accepts RowKind "${k}"`, () => {
      expect(rowKindSchema.safeParse(k).success).toBe(true);
    });
  }

  it("rejects CONNECTOR (D12 regression guard)", () => {
    expect(rowKindSchema.safeParse("CONNECTOR").success).toBe(false);
  });

  it("rejects lowercase variant", () => {
    expect(rowKindSchema.safeParse("exercise").success).toBe(false);
  });

  it("has 9 values (post-D12; CONNECTOR removed)", () => {
    expect(ROW_KINDS).toHaveLength(9);
  });
});

describe("positionSchema", () => {
  for (const p of POSITIONS) {
    it(`accepts Position "${p}"`, () => {
      expect(positionSchema.safeParse(p).success).toBe(true);
    });
  }

  it("rejects unknown position", () => {
    expect(positionSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it("has 11 values", () => {
    expect(POSITIONS).toHaveLength(11);
  });
});

describe("urlAppliesToSchema / footnoteMarkerSchema", () => {
  it("urlAppliesToSchema accepts previous_exercise_row", () => {
    expect(urlAppliesToSchema.safeParse("previous_exercise_row").success).toBe(true);
  });

  it("urlAppliesToSchema accepts whole_schema", () => {
    expect(urlAppliesToSchema.safeParse("whole_schema").success).toBe(true);
  });

  it("urlAppliesToSchema rejects unknown value", () => {
    expect(urlAppliesToSchema.safeParse("anywhere").success).toBe(false);
  });

  it("footnoteMarkerSchema accepts *", () => {
    expect(footnoteMarkerSchema.safeParse("*").success).toBe(true);
  });

  it("footnoteMarkerSchema accepts **", () => {
    expect(footnoteMarkerSchema.safeParse("**").success).toBe(true);
  });

  it("footnoteMarkerSchema rejects ***", () => {
    expect(footnoteMarkerSchema.safeParse("***").success).toBe(false);
  });
});

describe("schemaRowPayloadSchema (9-variant union)", () => {
  it("accepts EXERCISE atomic", () => {
    expect(schemaRowPayloadSchema.safeParse(exercisePayload).success).toBe(true);
  });

  it("accepts REST", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "REST",
        raw: "2 min",
        parsed: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
  });

  it("accepts FOOTNOTE", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "FOOTNOTE",
        marker: "*",
        target: "each_round",
        content: {
          elements: [
            { exerciseId: cuidA, reps: { kind: "count", value: 10 } },
            { exerciseId: cuidB, reps: { kind: "count", value: 10 } },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("accepts STANDALONE_LOAD", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_LOAD",
        load: { kind: "absolute", weight: { variant: "single", valueKg: 60 } },
        scope: "applies_to_all_preceding_rows",
      }).success,
    ).toBe(true);
  });

  it("accepts STANDALONE_URL", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_URL",
        url: "https://example.com/x.mp4",
        wrapped: true,
        appliesTo: "previous_exercise_row",
      }).success,
    ).toBe(true);
  });

  it("accepts PLACEHOLDER", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: "muscle_group_reference",
          text: "biceps / triceps",
        },
      }).success,
    ).toBe(true);
  });

  it("accepts INNER_LADDER_MARKER", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "INNER_LADDER_MARKER",
        steps: [36, 28, 20],
      }).success,
    ).toBe(true);
  });

  it("accepts REP_DEFINITION inline_equality", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "REP_DEFINITION",
        equality: {
          form: "inline_equality",
          totalReps: 5,
          composition: [{ exerciseId: cuidA, count: 3 }],
        },
      }).success,
    ).toBe(true);
  });

  it("accepts REST_SLOT", () => {
    expect(schemaRowPayloadSchema.safeParse({ rowKind: "REST_SLOT" }).success).toBe(true);
  });

  it("rejects rowKind: CONNECTOR (D12 regression guard)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "CONNECTOR",
        form: "then",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown rowKind", () => {
    expect(schemaRowPayloadSchema.safeParse({ rowKind: "FAKE" }).success).toBe(false);
  });

  it("rejects EXERCISE payload missing exercise field", () => {
    expect(schemaRowPayloadSchema.safeParse({ rowKind: "EXERCISE" }).success).toBe(false);
  });

  it("rejects INNER_LADDER_MARKER with empty steps", () => {
    expect(
      schemaRowPayloadSchema.safeParse({ rowKind: "INNER_LADDER_MARKER", steps: [] }).success,
    ).toBe(false);
  });
});

describe("schemaRowSchema", () => {
  it("accepts a fully-populated minimal row (EXERCISE)", () => {
    expect(schemaRowSchema.safeParse(baseRow).success).toBe(true);
  });

  it("accepts row with all VO fields populated", () => {
    expect(
      schemaRowSchema.safeParse({
        ...baseRow,
        load: { kind: "absolute", weight: { variant: "single", valueKg: 24 } },
        reps: { kind: "count", value: 12 },
        position: "NEUTRAL_GRIP",
      }).success,
    ).toBe(true);
  });

  it("rejects non-cuid id", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, id: "x" }).success).toBe(false);
  });

  it("rejects order: 0", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, order: 0 }).success).toBe(false);
  });

  it("rejects notes beyond MAX length", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, notes: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("createSchemaRowSchema", () => {
  it("accepts minimal valid create payload", () => {
    expect(
      createSchemaRowSchema.safeParse({
        schemaId: cuidA,
        rowKind: "EXERCISE",
        rowPayload: exercisePayload,
      }).success,
    ).toBe(true);
  });

  it("rejects missing schemaId", () => {
    expect(
      createSchemaRowSchema.safeParse({
        rowKind: "EXERCISE",
        rowPayload: exercisePayload,
      }).success,
    ).toBe(false);
  });

  it("accepts explicit null for VO fields", () => {
    expect(
      createSchemaRowSchema.safeParse({
        schemaId: cuidA,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
        load: null,
        reps: null,
      }).success,
    ).toBe(true);
  });
});

describe("updateSchemaRowSchema", () => {
  it("accepts empty object", () => {
    expect(updateSchemaRowSchema.safeParse({}).success).toBe(true);
  });

  it("accepts position-only update", () => {
    expect(updateSchemaRowSchema.safeParse({ position: "NEUTRAL_GRIP" }).success).toBe(true);
  });

  it("accepts notes-only update", () => {
    expect(updateSchemaRowSchema.safeParse({ notes: "tempo cue" }).success).toBe(true);
  });
});

describe("reorderSchemaRowsSchema", () => {
  it("accepts an array of three cuids", () => {
    expect(reorderSchemaRowsSchema.safeParse({ orderedIds: [cuidA, cuidB, cuidC] }).success).toBe(
      true,
    );
  });

  it("rejects empty array", () => {
    expect(reorderSchemaRowsSchema.safeParse({ orderedIds: [] }).success).toBe(false);
  });

  it("rejects duplicates", () => {
    const r = reorderSchemaRowsSchema.safeParse({ orderedIds: [cuidA, cuidA] });

    expect(r.success).toBe(false);

    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe("orderedIds must be unique");
    }
  });
});
