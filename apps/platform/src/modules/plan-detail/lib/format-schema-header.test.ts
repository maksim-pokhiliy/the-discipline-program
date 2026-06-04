import { describe, expect, it } from "vitest";

import type { ArchetypeParams } from "@repo/contracts/lms/schema";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { formatSchemaHeader } from "./format-schema-header";

const now = new Date("2025-01-06T00:00:00Z");

const DEFAULT_SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const DEFAULT_BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const DEFAULT_ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";

const makeSchema = (
  archetypeParams: ArchetypeParams,
  overrides: Partial<SchemaWithBody["schema"]> = {},
): SchemaWithBody => ({
  schema: {
    id: DEFAULT_SCHEMA_ID,
    blockId: DEFAULT_BLOCK_ID,
    parentSchemaId: null,
    alternatingGroupId: null,
    order: 10,
    kind: "ATOMIC",
    archetypeId: DEFAULT_ARCHETYPE_ID,
    header: null,
    archetypeParams,
    intensity: null,
    trailingConnector: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  },
  rows: [],
  subSchemas: [],
});

describe("formatSchemaHeader", () => {
  it("returns the persisted header verbatim when non-null and non-empty", () => {
    const schema = makeSchema(
      { archetype: "amrap-flat", params: { durationMin: 12 } },
      { header: "Coach-authored title" },
    );

    expect(formatSchemaHeader(schema, "AMRAP flat")).toBe("Coach-authored title");
  });

  it("falls through to fallback when header is an empty string", () => {
    const schema = makeSchema(
      { archetype: "amrap-flat", params: { durationMin: 12 } },
      { header: "" },
    );

    expect(formatSchemaHeader(schema, "AMRAP flat")).toBe("AMRAP 12 min");
  });

  it("renders n-rounds count_times_reps as '<count> × <reps>'", () => {
    const schema = makeSchema({
      archetype: "n-rounds",
      params: { countForm: "count_times_reps", count: 5, repsPerSet: 10 },
    });

    expect(formatSchemaHeader(schema, null)).toBe("5 × 10");
  });

  it("renders n-rounds exact as '<count> rounds'", () => {
    const schema = makeSchema({
      archetype: "n-rounds",
      params: { countForm: "exact", count: 5 },
    });

    expect(formatSchemaHeader(schema, null)).toBe("5 rounds");
  });

  it("renders n-rounds range as '<min>–<max> rounds'", () => {
    const schema = makeSchema({
      archetype: "n-rounds",
      params: { countForm: "range", countRange: { min: 3, max: 5 } },
    });

    expect(formatSchemaHeader(schema, null)).toBe("3–5 rounds");
  });

  it("renders n-rounds 'N rounds' fallback when params are insufficient", () => {
    const schema = makeSchema({
      archetype: "n-rounds",
      params: { countForm: "exact" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("N rounds");
  });

  it("renders amrap-flat as 'AMRAP <durationMin> min'", () => {
    const schema = makeSchema({
      archetype: "amrap-flat",
      params: { durationMin: 20 },
    });

    expect(formatSchemaHeader(schema, null)).toBe("AMRAP 20 min");
  });

  it("renders emom-nested-per-minute as 'EMOM <durationMin> min'", () => {
    const schema = makeSchema({
      archetype: "emom-nested-per-minute",
      params: { durationMin: 12 },
    });

    expect(formatSchemaHeader(schema, null)).toBe("EMOM 12 min");
  });

  it("renders ladder-descending as '<steps> ladder' with steps joined by '-'", () => {
    const schema = makeSchema({
      archetype: "ladder-descending",
      params: { steps: [12, 9, 6] },
    });

    expect(formatSchemaHeader(schema, null)).toBe("12-9-6 ladder");
  });

  it("renders ladder-ascending as '<steps> ladder' with steps joined by '-'", () => {
    const schema = makeSchema({
      archetype: "ladder-ascending",
      params: { steps: [3, 6, 9] },
    });

    expect(formatSchemaHeader(schema, null)).toBe("3-6-9 ladder");
  });

  it("renders named-themed-sets as '<theme> sets'", () => {
    const schema = makeSchema({
      archetype: "named-themed-sets",
      params: { count: 5, theme: "Hero" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Hero sets");
  });

  it("renders named-exercise-program as the programKind with underscores replaced by spaces (D-17)", () => {
    const schema = makeSchema({
      archetype: "named-exercise-program",
      params: {
        exerciseId: "ckabc1234567890abcdef012345",
        program: { programKind: "wave", stages: [{ reps: 5 }] },
      },
    });

    expect(formatSchemaHeader(schema, null)).toBe("wave");
  });

  it("renders super-set as 'Super-set × <rounds> rounds'", () => {
    const schema = makeSchema({
      archetype: "super-set",
      params: {
        pairs: [
          { label: "A", schemaRows: ["ckabc1234567890abcdef012345"] },
          { label: "B", schemaRows: ["ckxyz1234567890abcdef012345"] },
        ],
        rounds: 4,
      },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Super-set × 4 rounds");
  });

  it("renders run-distance with value as 'Run <value> <unit>'", () => {
    const schema = makeSchema({
      archetype: "run-distance",
      params: { modality: "RUN", distance: { unit: "km", value: 5 } },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Run 5 km");
  });

  it("renders run-distance with range as 'Run <min>–<max> <unit>'", () => {
    const schema = makeSchema({
      archetype: "run-distance",
      params: { modality: "RUN", distance: { unit: "km", range: { min: 3, max: 5 } } },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Run 3–5 km");
  });

  it("renders run-distance without distance as bare 'Run'", () => {
    const schema = makeSchema({
      archetype: "run-distance",
      params: { modality: "RUN" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Run");
  });

  it("renders time-window-outer as '<start> → <end>'", () => {
    const schema = makeSchema({
      archetype: "time-window-outer",
      params: { window: { startHhMm: "10:00", endHhMm: "11:30" } },
    });

    expect(formatSchemaHeader(schema, null)).toBe("10:00 → 11:30");
  });

  it("falls back to archetypeLabel for an archetype with no special-case formatter when label is non-null", () => {
    const schema = makeSchema({
      archetype: "single-line-bare",
      params: {},
    });

    expect(formatSchemaHeader(schema, "Single line bare")).toBe("Single line bare");
  });

  it("falls back to the dash-replaced archetype discriminator when label is null", () => {
    const schema = makeSchema({
      archetype: "pull-ups-dips-cycle",
      params: {},
    });

    expect(formatSchemaHeader(schema, null)).toBe("pull ups dips cycle");
  });
});

const NULL_TRIAD = { kind: null, archetypeId: null, archetypeParams: null } as const;
const FALLBACK_PARAMS = { archetype: "single-line-bare" as const, params: {} };

describe("formatSchemaHeader composition-only schemas (DR-1 widen, WARNING-2)", () => {
  it("derives an EMOM header from a cadence composition when there is no archetype", () => {
    const schema = makeSchema(FALLBACK_PARAMS, {
      ...NULL_TRIAD,
      composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 4 } },
      label: { kind: "cadence", family: "INTERVALIC" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("EMOM 1’×4");
  });

  it("derives a rounds header from a count composition when there is no archetype", () => {
    const schema = makeSchema(FALLBACK_PARAMS, {
      ...NULL_TRIAD,
      composition: { repetition: { kind: "count", count: 5 } },
      label: { kind: "rounds", family: "ROUNDS" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("5 rounds");
  });

  it("returns an empty string for a bare composition-only schema with no axes", () => {
    const schema = makeSchema(FALLBACK_PARAMS, {
      ...NULL_TRIAD,
      composition: {},
      label: { kind: "flat", family: "FLAT" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("");
  });

  it("lets a coach-entered header win over the derived composition label", () => {
    const schema = makeSchema(FALLBACK_PARAMS, {
      ...NULL_TRIAD,
      header: "Engine builder",
      composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 16 } },
      label: { kind: "cadence", family: "INTERVALIC" },
    });

    expect(formatSchemaHeader(schema, null)).toBe("Engine builder");
  });

  it("routes to the archetype branch when archetypeParams is present", () => {
    const schema = makeSchema({
      archetype: "n-rounds",
      params: { countForm: "exact", count: 5 },
    });

    expect(formatSchemaHeader(schema, null)).toBe("5 rounds");
  });
});
