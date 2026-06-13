import { describe, expect, it } from "vitest";

import { SCHEMA_ROW_CONSTANTS } from "./schema-row.constants";
import {
  createSchemaRowSchema,
  reorderSchemaRowsSchema,
  schemaRowSchema,
  updateSchemaRowSchema,
} from "./schema-row.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const baseModifier = {
  id: cuidC,
  name: "from sofa",
  nameLower: "from sofa",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseRow = {
  id: cuidA,
  schemaId: cuidB,
  order: 1,
  exerciseId: cuidA,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("schemaRowSchema", () => {
  it("accepts a minimal exercise row", () => {
    expect(schemaRowSchema.safeParse(baseRow).success).toBe(true);
  });

  it("accepts a row with all VO fields + sets + modifiers populated", () => {
    expect(
      schemaRowSchema.safeParse({
        ...baseRow,
        sets: 3,
        rowGroupId: cuidB,
        load: { kind: "absolute", count: 1, kg: 24 },
        reps: { kind: "count", value: 12 },
        tempo: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
        modifiers: [baseModifier],
        notes: ["keep the chest up"],
      }).success,
    ).toBe(true);
  });

  it("rejects a non-cuid id", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, id: "x" }).success).toBe(false);
  });

  it("rejects order: 0", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, order: 0 }).success).toBe(false);
  });

  it("rejects a missing exerciseId", () => {
    const withoutExerciseId: Record<string, unknown> = { ...baseRow };

    delete withoutExerciseId.exerciseId;

    expect(schemaRowSchema.safeParse(withoutExerciseId).success).toBe(false);
  });

  it("rejects sets: 0 (positive int)", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, sets: 0 }).success).toBe(false);
  });

  it("strips the dropped rowKind/rowPayload/position fields", () => {
    const result = schemaRowSchema.safeParse({
      ...baseRow,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE" },
      position: "NEUTRAL_GRIP",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("rowKind");
      expect(result.data).not.toHaveProperty("rowPayload");
      expect(result.data).not.toHaveProperty("position");
    }
  });

  it("rejects notes with an empty-string entry", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, notes: [""] }).success).toBe(false);
  });
});

describe("createSchemaRowSchema", () => {
  it("accepts a minimal valid create payload", () => {
    expect(createSchemaRowSchema.safeParse({ schemaId: cuidA, exerciseId: cuidB }).success).toBe(
      true,
    );
  });

  it("accepts a create payload with modifierIds", () => {
    expect(
      createSchemaRowSchema.safeParse({ schemaId: cuidA, exerciseId: cuidB, modifierIds: [cuidC] })
        .success,
    ).toBe(true);
  });

  it("rejects duplicate modifierIds", () => {
    expect(
      createSchemaRowSchema.safeParse({
        schemaId: cuidA,
        exerciseId: cuidB,
        modifierIds: [cuidC, cuidC],
      }).success,
    ).toBe(false);
  });

  it("rejects more modifierIds than the cap", () => {
    const tooMany = Array.from(
      { length: SCHEMA_ROW_CONSTANTS.MAX_MODIFIERS_PER_ROW + 1 },
      (_, i) => `clz123456789012345678${i.toString().padStart(4, "x")}`,
    );

    expect(
      createSchemaRowSchema.safeParse({ schemaId: cuidA, exerciseId: cuidB, modifierIds: tooMany })
        .success,
    ).toBe(false);
  });

  it("rejects missing schemaId", () => {
    expect(createSchemaRowSchema.safeParse({ exerciseId: cuidB }).success).toBe(false);
  });

  it("rejects missing exerciseId", () => {
    expect(createSchemaRowSchema.safeParse({ schemaId: cuidA }).success).toBe(false);
  });

  it("does not accept a rowGroupId on create (membership set via the row-group route)", () => {
    const result = createSchemaRowSchema.safeParse({
      schemaId: cuidA,
      exerciseId: cuidB,
      rowGroupId: cuidC,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("rowGroupId");
    }
  });
});

describe("updateSchemaRowSchema", () => {
  it("accepts an empty object", () => {
    expect(updateSchemaRowSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a notes-list-only update", () => {
    expect(updateSchemaRowSchema.safeParse({ notes: ["tempo cue"] }).success).toBe(true);
  });

  it("accepts a modifierIds-only update", () => {
    expect(updateSchemaRowSchema.safeParse({ modifierIds: [cuidC] }).success).toBe(true);
  });

  it("strips exerciseId (immutable — omitted from the update shape)", () => {
    const result = updateSchemaRowSchema.safeParse({ exerciseId: cuidB });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("exerciseId");
    }
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
