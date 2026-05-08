import { describe, expect, it } from "vitest";

import {
  DISTANCE_UNIT_OPTIONS,
  EMOM_SLOT_ACTION_KIND_OPTIONS,
  INTERVAL_SLOT_ACTION_OPTIONS,
  LADDER_DIRECTION_OPTIONS,
  SCHEME_ARCHETYPE_KINDS,
  SCHEME_ARCHETYPE_KIND_OPTIONS,
  defaultSchemeParams,
} from "./scheme-archetype.constants";
import {
  schemeParamsDistanceSchema,
  schemeParamsEmomLoopSchema,
  schemeParamsIntervalLoopSchema,
  schemeParamsLadderSchema,
  schemeParamsSchema,
} from "./scheme-archetype.schema";
import { type SchemeArchetypeKind } from "./scheme-archetype.types";

describe("SCHEME_ARCHETYPE_KINDS", () => {
  it("includes SETS_REPS as the 9th archetype kind", () => {
    expect(SCHEME_ARCHETYPE_KINDS).toContain("SETS_REPS");
  });

  it("exposes all nine archetype kinds", () => {
    expect(SCHEME_ARCHETYPE_KINDS).toHaveLength(9);
  });
});

describe("defaultSchemeParams — SETS_REPS", () => {
  it("returns a 3-set default with no progression", () => {
    expect(defaultSchemeParams("SETS_REPS")).toEqual({ kind: "SETS_REPS", sets: 3 });
  });
});

describe("defaultSchemeParams round-trip across all archetypes", () => {
  it.each(SCHEME_ARCHETYPE_KINDS.map((kind) => [kind] as const))(
    "produces a value with matching kind for %s",
    (kind: SchemeArchetypeKind) => {
      const value = defaultSchemeParams(kind);

      expect(value.kind).toBe(kind);
    },
  );

  it.each(SCHEME_ARCHETYPE_KINDS.map((kind) => [kind] as const))(
    "the default value parses cleanly through schemeParamsSchema for %s",
    (kind: SchemeArchetypeKind) => {
      const value = defaultSchemeParams(kind);
      const parsed = schemeParamsSchema.parse(value);

      expect(parsed).toEqual(value);
    },
  );
});

describe("SCHEME_ARCHETYPE_KIND_OPTIONS", () => {
  it("exposes one option per known archetype kind", () => {
    expect(SCHEME_ARCHETYPE_KIND_OPTIONS).toHaveLength(SCHEME_ARCHETYPE_KINDS.length);
  });

  it("emits options whose value set matches SCHEME_ARCHETYPE_KINDS", () => {
    const optionValues = SCHEME_ARCHETYPE_KIND_OPTIONS.map((option) => option.value).sort();
    const kinds = [...SCHEME_ARCHETYPE_KINDS].sort();

    expect(optionValues).toEqual(kinds);
  });

  it("has a non-empty label for every entry", () => {
    for (const option of SCHEME_ARCHETYPE_KIND_OPTIONS) {
      expect(typeof option.label).toBe("string");
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate values", () => {
    const values = SCHEME_ARCHETYPE_KIND_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe("DISTANCE_UNIT_OPTIONS", () => {
  it("has values matching the distance unit enum on the schema", () => {
    const enumValues = [...schemeParamsDistanceSchema.shape.unit.options].sort();
    const optionValues = DISTANCE_UNIT_OPTIONS.map((option) => option.value).sort();

    expect(optionValues).toEqual(enumValues);
  });

  it("is non-empty and exposes label/value strings on every entry", () => {
    expect(DISTANCE_UNIT_OPTIONS.length).toBeGreaterThan(0);
    for (const option of DISTANCE_UNIT_OPTIONS) {
      expect(typeof option.value).toBe("string");
      expect(typeof option.label).toBe("string");
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate values", () => {
    const values = DISTANCE_UNIT_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe("INTERVAL_SLOT_ACTION_OPTIONS", () => {
  it("has values matching the interval-slot action enum on the schema", () => {
    const slotElement = schemeParamsIntervalLoopSchema.shape.slots.element;
    const enumValues = [...slotElement.shape.action.options].sort();
    const optionValues = INTERVAL_SLOT_ACTION_OPTIONS.map((option) => option.value).sort();

    expect(optionValues).toEqual(enumValues);
  });

  it("is non-empty and exposes non-empty labels", () => {
    expect(INTERVAL_SLOT_ACTION_OPTIONS.length).toBeGreaterThan(0);
    for (const option of INTERVAL_SLOT_ACTION_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate values", () => {
    const values = INTERVAL_SLOT_ACTION_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe("EMOM_SLOT_ACTION_KIND_OPTIONS", () => {
  it("has values matching the emom-action discriminator literals on the schema", () => {
    const slotElement = schemeParamsEmomLoopSchema.shape.slots.element;
    const actionUnion = slotElement.shape.action;
    const literalValues = actionUnion.options.map((variant) => variant.shape.kind.value).sort();
    const optionValues = EMOM_SLOT_ACTION_KIND_OPTIONS.map((option) => option.value).sort();

    expect(optionValues).toEqual(literalValues);
  });

  it("is non-empty and exposes non-empty labels", () => {
    expect(EMOM_SLOT_ACTION_KIND_OPTIONS.length).toBeGreaterThan(0);
    for (const option of EMOM_SLOT_ACTION_KIND_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate values", () => {
    const values = EMOM_SLOT_ACTION_KIND_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe("LADDER_DIRECTION_OPTIONS", () => {
  it("has values matching the ladder direction enum on the schema", () => {
    const enumValues = [...schemeParamsLadderSchema.shape.direction.options].sort();
    const optionValues = LADDER_DIRECTION_OPTIONS.map((option) => option.value).sort();

    expect(optionValues).toEqual(enumValues);
  });

  it("is non-empty and exposes non-empty labels", () => {
    expect(LADDER_DIRECTION_OPTIONS.length).toBeGreaterThan(0);
    for (const option of LADDER_DIRECTION_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate values", () => {
    const values = LADDER_DIRECTION_OPTIONS.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
  });
});
