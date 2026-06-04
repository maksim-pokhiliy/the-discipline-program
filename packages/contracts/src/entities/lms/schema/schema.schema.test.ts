import { describe, expect, it } from "vitest";

import { archetypeParamsSchema } from "./archetype-params.schema";
import { ARCHETYPE_FAMILIES, ARCHETYPE_NAMES, SCHEMA_KINDS } from "./schema.constants";
import {
  archetypeFamilySchema,
  archetypeNameSchema,
  createSchemaSchema,
  reorderSchemasSchema,
  schemaKindSchema,
  schemaSchema,
  schemaSchemaWithInvariants,
  schemaWithBodySchema,
  trailingConnectorSchema,
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
  alternatingGroupId: null,
  order: 1,
  kind: "ATOMIC" as const,
  archetypeId: cuidC,
  header: null,
  archetypeParams: {
    archetype: "n-rounds" as const,
    params: { countForm: "exact" as const, count: 5 },
  },
  intensity: null,
  trailingConnector: null,
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

describe("schemaKindSchema", () => {
  for (const k of SCHEMA_KINDS) {
    it(`accepts SchemaKind "${k}"`, () => {
      expect(schemaKindSchema.safeParse(k).success).toBe(true);
    });
  }

  it("rejects lowercase variant", () => {
    expect(schemaKindSchema.safeParse("atomic").success).toBe(false);
  });

  it("rejects unknown SchemaKind", () => {
    expect(schemaKindSchema.safeParse("UNKNOWN").success).toBe(false);
  });
});

describe("archetypeFamilySchema", () => {
  for (const f of ARCHETYPE_FAMILIES) {
    it(`accepts ArchetypeFamily "${f}"`, () => {
      expect(archetypeFamilySchema.safeParse(f).success).toBe(true);
    });
  }

  it("rejects unknown family", () => {
    expect(archetypeFamilySchema.safeParse("unknown_family").success).toBe(false);
  });
});

describe("archetypeNameSchema", () => {
  for (const n of ARCHETYPE_NAMES) {
    it(`accepts ArchetypeName "${n}"`, () => {
      expect(archetypeNameSchema.safeParse(n).success).toBe(true);
    });
  }

  it("rejects unknown archetype name", () => {
    expect(archetypeNameSchema.safeParse("not-a-real-archetype").success).toBe(false);
  });

  it("exposes 34 names", () => {
    expect(ARCHETYPE_NAMES).toHaveLength(34);
  });
});

describe("trailingConnectorSchema", () => {
  it("accepts form: then without roundsCount", () => {
    expect(trailingConnectorSchema.safeParse({ form: "then" }).success).toBe(true);
  });

  it("accepts form: then_dots without roundsCount", () => {
    expect(trailingConnectorSchema.safeParse({ form: "then_dots" }).success).toBe(true);
  });

  it("accepts form: then_n_rounds with roundsCount", () => {
    expect(
      trailingConnectorSchema.safeParse({ form: "then_n_rounds", roundsCount: 3 }).success,
    ).toBe(true);
  });

  it("rejects form: then_n_rounds without roundsCount", () => {
    expect(trailingConnectorSchema.safeParse({ form: "then_n_rounds" }).success).toBe(false);
  });

  it("rejects form: then with roundsCount (XOR refine)", () => {
    expect(trailingConnectorSchema.safeParse({ form: "then", roundsCount: 3 }).success).toBe(false);
  });

  it("rejects form: then_dots with roundsCount", () => {
    expect(trailingConnectorSchema.safeParse({ form: "then_dots", roundsCount: 2 }).success).toBe(
      false,
    );
  });

  it("rejects roundsCount: 0", () => {
    expect(
      trailingConnectorSchema.safeParse({ form: "then_n_rounds", roundsCount: 0 }).success,
    ).toBe(false);
  });
});

describe("archetypeParamsSchema (34-variant flat union)", () => {
  it("covers all 34 ArchetypeName values (regression guard)", () => {
    expect(ARCHETYPE_NAMES).toHaveLength(34);
  });

  it("accepts n-rounds exact", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "n-rounds",
      params: { countForm: "exact", count: 5 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts n-rounds range", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "n-rounds",
      params: { countForm: "range", countRange: { min: 3, max: 5 } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts alternating-sets", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "alternating-sets",
      params: { setEnumeration: [1, 2, 3] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts ladder-descending", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "ladder-descending",
      params: { steps: [10, 8, 6, 4, 2] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts ladder-ascending", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "ladder-ascending",
      params: { steps: [2, 4, 6, 8] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts ladder-vertex-down-pyramid", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "ladder-vertex-down-pyramid",
      params: { steps: [10, 5, 10] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts ladder-spike", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "ladder-spike",
      params: { steps: [2, 8, 2] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts parallel-ladders-descending", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "parallel-ladders-descending",
      params: { ladders: [{ steps: [10, 8], direction: "desc" }] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts parallel-ladders-mixed-direction", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "parallel-ladders-mixed-direction",
      params: { ladders: [{ steps: [3, 5] }] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts parallel-pyramids", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "parallel-pyramids",
      params: { pyramids: [{ steps: [2, 4, 2] }] },
    });

    expect(r.success).toBe(true);
  });

  it("accepts amrap-flat", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "amrap-flat",
      params: { durationMin: 20 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts emom-nested-per-minute with rounds", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "emom-nested-per-minute",
      params: { durationMin: 10, rounds: 3 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts emom-sub-minute-slot single", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "emom-sub-minute-slot",
      params: { slot: { kind: "single", minute: 1 } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts time-window-outer", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "time-window-outer",
      params: { window: { startHhMm: "09:00", endHhMm: "11:00" } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-rounds-with-rest", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-rounds-with-rest",
      params: {
        count: 3,
        rest: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
      },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-intervals-then-rounds", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-intervals-then-rounds",
      params: {
        intervalsCount: 3,
        restMin: 1,
        innerRounds: 5,
        preambleExercise: { form: "atomic", exerciseId: cuidA },
        preambleReps: { kind: "count", value: 10 },
      },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-intervals-work-rest-fixed", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-intervals-work-rest-fixed",
      params: { intervalsCount: 4, workMin: 3, restMin: 1 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-intervals-work-rest-progressive", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-intervals-work-rest-progressive",
      params: { sets: 5, workMin: 2, offMin: 1, progressiveSeed: "12345" },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-intervals-on-off-max-tail", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-intervals-on-off-max-tail",
      params: { intervals: 3, onMin: 2, offMin: 1, tailExerciseId: cuidA },
    });

    expect(r.success).toBe(true);
  });

  it("accepts composite-rolling-rounds", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "composite-rolling-rounds",
      params: { everyNthMin: 5, rounds: 4, totalMin: 20 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts nested-rounds-over-rounds", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "nested-rounds-over-rounds",
      params: { outerCount: 3 },
    });

    expect(r.success).toBe(true);
  });

  it("accepts nested-rounds-over-parallel-ladder", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "nested-rounds-over-parallel-ladder",
      params: { outerCount: { min: 2, max: 4 } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts nested-composite-rounds-over-ladder", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "nested-composite-rounds-over-ladder",
      params: {
        outerCount: 3,
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
      },
    });

    expect(r.success).toBe(true);
  });

  it("accepts named-themed-sets", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "named-themed-sets",
      params: { count: 4, theme: "annie" },
    });

    expect(r.success).toBe(true);
  });

  it("accepts named-exercise-program", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "named-exercise-program",
      params: {
        exerciseId: cuidA,
        program: {
          programKind: "drop_set",
          stages: [{ reps: 10 }],
        },
      },
    });

    expect(r.success).toBe(true);
  });

  it("accepts super-set", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "super-set",
      params: {
        pairs: [{ label: "A", schemaRows: [cuidA, cuidB] }],
        rounds: 3,
      },
    });

    expect(r.success).toBe(true);
  });

  it("accepts run-distance with value", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "run-distance",
      params: { modality: "RUN", distance: { unit: "km", value: 5 } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts run-distance with range", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "run-distance",
      params: { modality: "RUN", distance: { unit: "km", range: { min: 3, max: 5 } } },
    });

    expect(r.success).toBe(true);
  });

  it("accepts single-line-bare empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "single-line-bare",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts single-line-total-counter", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "single-line-total-counter",
      params: { totalFlag: true },
    });

    expect(r.success).toBe(true);
  });

  it("accepts flat-list-headerless empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "flat-list-headerless",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts pull-ups-dips-cycle empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "pull-ups-dips-cycle",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts placeholder-body empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "placeholder-body",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts practice-list empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "practice-list",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts url-only-body empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "url-only-body",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("accepts single-line-with-then-connector empty params", () => {
    const r = archetypeParamsSchema.safeParse({
      archetype: "single-line-with-then-connector",
      params: {},
    });

    expect(r.success).toBe(true);
  });

  it("rejects unknown archetype discriminator", () => {
    expect(
      archetypeParamsSchema.safeParse({ archetype: "fake-archetype", params: {} }).success,
    ).toBe(false);
  });

  it("rejects empty-param archetype with extra keys (strict)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "single-line-bare",
        params: { rogue: 1 },
      }).success,
    ).toBe(false);
  });

  it("rejects cross-variant param mismatch (n-rounds with amrap durationMin)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "n-rounds",
        params: { durationMin: 10 },
      }).success,
    ).toBe(false);
  });

  it("accepts super-set pair with single row (post-C0-005 min(1))", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "super-set",
        params: { pairs: [{ label: "A", schemaRows: [cuidA] }], rounds: 1 },
      }).success,
    ).toBe(true);
  });

  it("rejects super-set pair with empty schemaRows array (min(1) lower bound)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "super-set",
        params: { pairs: [{ label: "A", schemaRows: [] }], rounds: 1 },
      }).success,
    ).toBe(false);
  });

  it("rejects ladder with empty steps", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "ladder-descending",
        params: { steps: [] },
      }).success,
    ).toBe(false);
  });
});

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

  it("accepts alternatingGroupId: null (top-level schema, not a member)", () => {
    expect(schemaSchema.safeParse({ ...baseSchema, alternatingGroupId: null }).success).toBe(true);
  });

  it("accepts alternatingGroupId: valid cuid (sibling member of an alternating group)", () => {
    expect(schemaSchema.safeParse({ ...baseSchema, alternatingGroupId: cuidD }).success).toBe(true);
  });

  it("rejects missing alternatingGroupId", () => {
    const { alternatingGroupId: _agId, ...rest } = baseSchema;

    expect(_agId).toBeNull();
    expect(schemaSchema.safeParse(rest).success).toBe(false);
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
      schema: { ...baseSchema, kind: "NESTED" },
      rows: [],
      subSchemas: [
        {
          schema: { ...baseSchema, id: cuidE, parentSchemaId: cuidA, kind: "ATOMIC" },
          rows: [{ ...baseRow, schemaId: cuidE }],
          subSchemas: [],
        },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.schema.kind).toBe("NESTED");
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

describe("schemaSchemaWithInvariants (sub-schema kind constraint)", () => {
  it("accepts top-level (parentSchemaId: null) with any SchemaKind", () => {
    for (const k of SCHEMA_KINDS) {
      const candidate = {
        ...baseSchema,
        kind: k,
        parentSchemaId: null,
      };

      expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(true);
    }
  });

  it("accepts sub-schema (parentSchemaId set) with kind=ATOMIC", () => {
    const candidate = { ...baseSchema, parentSchemaId: cuidB, kind: "ATOMIC" as const };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(true);
  });

  it("accepts sub-schema with kind=HEADERLESS (per domain §1.4 invariant)", () => {
    const candidate = { ...baseSchema, parentSchemaId: cuidB, kind: "HEADERLESS" as const };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(true);
  });

  it("rejects sub-schema with kind=NESTED (one-level nesting only)", () => {
    const candidate = { ...baseSchema, parentSchemaId: cuidB, kind: "NESTED" as const };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(false);
  });

  it("rejects sub-schema with kind=NAMED", () => {
    const candidate = { ...baseSchema, parentSchemaId: cuidB, kind: "NAMED" as const };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(false);
  });

  it("rejects sub-schema with kind=COMPOSITE", () => {
    const candidate = { ...baseSchema, parentSchemaId: cuidB, kind: "COMPOSITE" as const };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(false);
  });

  it("accepts sub-schema (parentSchemaId set) with alternatingGroupId: null", () => {
    const candidate = {
      ...baseSchema,
      parentSchemaId: cuidB,
      kind: "ATOMIC" as const,
      alternatingGroupId: null,
    };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(true);
  });

  it("accepts top-level schema (parentSchemaId: null) with alternatingGroupId set", () => {
    const candidate = {
      ...baseSchema,
      parentSchemaId: null,
      kind: "ATOMIC" as const,
      alternatingGroupId: cuidD,
    };

    expect(schemaSchemaWithInvariants.safeParse(candidate).success).toBe(true);
  });

  it("rejects schema with both parentSchemaId and alternatingGroupId set", () => {
    const candidate = {
      ...baseSchema,
      parentSchemaId: cuidB,
      kind: "ATOMIC" as const,
      alternatingGroupId: cuidD,
    };

    const r = schemaSchemaWithInvariants.safeParse(candidate);

    expect(r.success).toBe(false);

    if (!r.success) {
      const altGroupIssue = r.error.issues.find((i) => i.path[0] === "alternatingGroupId");

      expect(altGroupIssue).toBeDefined();
      expect(altGroupIssue?.message).toBe(
        "alternatingGroupId is not allowed on sub-schemas (parentSchemaId is set)",
      );
    }
  });
});

describe("createSchemaSchema", () => {
  it("accepts minimal valid create payload", () => {
    const r = createSchemaSchema.safeParse({
      blockId: cuidA,
      kind: "ATOMIC",
      archetypeId: cuidB,
      archetypeParams: {
        archetype: "n-rounds",
        params: { countForm: "exact", count: 3 },
      },
    });

    expect(r.success).toBe(true);
  });

  it("rejects missing required field (blockId)", () => {
    const r = createSchemaSchema.safeParse({
      kind: "ATOMIC",
      archetypeId: cuidB,
      archetypeParams: { archetype: "n-rounds", params: { countForm: "exact", count: 3 } },
    });

    expect(r.success).toBe(false);
  });

  it("accepts a composition-only create (no kind/archetypeId/archetypeParams) when composition present", () => {
    const r = createSchemaSchema.safeParse({
      blockId: cuidA,
      composition: { scoring: { kind: "prescribed" } },
    });

    expect(r.success).toBe(true);
  });

  it("rejects a partial triad (kind without archetypeId/archetypeParams)", () => {
    const r = createSchemaSchema.safeParse({
      blockId: cuidA,
      kind: "ATOMIC",
    });

    expect(r.success).toBe(false);
  });

  it("accepts explicit null intensity / trailingConnector / notes", () => {
    const r = createSchemaSchema.safeParse({
      blockId: cuidA,
      kind: "ATOMIC",
      archetypeId: cuidB,
      archetypeParams: { archetype: "n-rounds", params: { countForm: "exact", count: 1 } },
      intensity: null,
      trailingConnector: null,
      notes: null,
    });

    expect(r.success).toBe(true);
  });
});

describe("updateSchemaSchema", () => {
  it("accepts empty object (no-op update)", () => {
    expect(updateSchemaSchema.safeParse({}).success).toBe(true);
  });

  it("accepts kind-only update", () => {
    expect(updateSchemaSchema.safeParse({ kind: "HEADERLESS" }).success).toBe(true);
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
