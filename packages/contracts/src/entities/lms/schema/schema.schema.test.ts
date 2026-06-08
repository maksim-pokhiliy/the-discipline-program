import { describe, expect, it } from "vitest";

import {
  createSchemaSchema,
  reorderSchemasSchema,
  schemaSchema,
  schemaWithBodySchema,
  updateSchemaSchema,
} from "./schema.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";
const cuidD = "clz1234567890123456789ddd";
const cuidE = "clz1234567890123456789eee";

const baseSchema = {
  id: cuidA,
  blockId: cuidB,
  parentSchemaId: null,
  order: 1,
  header: null,
  intensity: null,
  composition: null,
  label: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseRow = {
  id: cuidD,
  schemaId: cuidA,
  order: 1,
  rowKind: "REST_SLOT" as const,
  rowPayload: { rowKind: "REST_SLOT" as const },
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

describe("schemaSchema", () => {
  it("accepts a fully-populated top-level schema", () => {
    expect(schemaSchema.safeParse(baseSchema).success).toBe(true);
  });

  it("accepts header at MAX length", () => {
    const r = schemaSchema.safeParse({ ...baseSchema, header: "x".repeat(500) });

    expect(r.success).toBe(true);
  });

  it("rejects header over MAX length", () => {
    const r = schemaSchema.safeParse({ ...baseSchema, header: "x".repeat(501) });

    expect(r.success).toBe(false);
  });

  it("rejects order: 0", () => {
    expect(schemaSchema.safeParse({ ...baseSchema, order: 0 }).success).toBe(false);
  });

  it("rejects a non-cuid id", () => {
    expect(schemaSchema.safeParse({ ...baseSchema, id: "not-a-cuid" }).success).toBe(false);
  });

  it("accepts a composition-only read shape", () => {
    const compositionOnly = {
      ...baseSchema,
      composition: { repetition: { kind: "cadence" as const, everyMin: 1, rounds: 4 } },
      label: { kind: "cadence" as const, family: "INTERVALIC" as const },
    };

    expect(schemaSchema.safeParse(compositionOnly).success).toBe(true);
  });
});

describe("schemaWithBodySchema", () => {
  it("accepts a flat schema with populated rows and empty subSchemas", () => {
    const result = schemaWithBodySchema.safeParse({
      schema: baseSchema,
      rows: [baseRow],
      subSchemas: [],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.schema.id).toBe(baseSchema.id);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.rows[0]?.id).toBe(baseRow.id);
      expect(result.data.subSchemas).toEqual([]);
    }
  });

  it("accepts a nested schema, depth-2, with populated subSchemas", () => {
    const result = schemaWithBodySchema.safeParse({
      schema: baseSchema,
      rows: [],
      subSchemas: [
        {
          schema: { ...baseSchema, id: cuidE, parentSchemaId: cuidA },
          rows: [{ ...baseRow, schemaId: cuidE }],
          subSchemas: [],
        },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.subSchemas).toHaveLength(1);
      expect(result.data.subSchemas[0]?.schema.id).toBe(cuidE);
      expect(result.data.subSchemas[0]?.schema.parentSchemaId).toBe(cuidA);
      expect(result.data.subSchemas[0]?.rows).toHaveLength(1);
      expect(result.data.subSchemas[0]?.subSchemas).toEqual([]);
    }
  });

  it("accepts a schema with empty rows", () => {
    const result = schemaWithBodySchema.safeParse({
      schema: baseSchema,
      rows: [],
      subSchemas: [],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.rows).toEqual([]);
    }
  });

  it("rejects a missing subSchemas field", () => {
    const result = schemaWithBodySchema.safeParse({ schema: baseSchema, rows: [] });

    expect(result.success).toBe(false);
  });
});

describe("createSchemaSchema", () => {
  it("rejects missing required field (blockId)", () => {
    const r = createSchemaSchema.safeParse({
      composition: { repetition: { kind: "once" } },
    });

    expect(r.success).toBe(false);
  });

  it("accepts a composition-only create when composition present", () => {
    const r = createSchemaSchema.safeParse({
      blockId: cuidA,
      composition: { repetition: { kind: "once" } },
    });

    expect(r.success).toBe(true);
  });
});

describe("updateSchemaSchema", () => {
  it("accepts empty object (no-op update)", () => {
    expect(updateSchemaSchema.safeParse({}).success).toBe(true);
  });

  it("accepts notes update", () => {
    expect(updateSchemaSchema.safeParse({ notes: "focus" }).success).toBe(true);
  });
});

describe("reorderSchemasSchema", () => {
  it("accepts an array of three cuids", () => {
    expect(reorderSchemasSchema.safeParse({ orderedIds: [cuidA, cuidB, cuidC] }).success).toBe(
      true,
    );
  });

  it("rejects an empty array", () => {
    expect(reorderSchemasSchema.safeParse({ orderedIds: [] }).success).toBe(false);
  });

  it("rejects duplicate cuids", () => {
    const r = reorderSchemasSchema.safeParse({ orderedIds: [cuidA, cuidA] });

    expect(r.success).toBe(false);

    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe("orderedIds must be unique");
    }
  });

  it("rejects a non-cuid", () => {
    expect(reorderSchemasSchema.safeParse({ orderedIds: [cuidA, "not-a-cuid"] }).success).toBe(
      false,
    );
  });
});
