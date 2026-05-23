import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../entities/lms/schema-row";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

describe("LMS schemaRowPayload parity — 9 RowKinds verbatim from data.js", () => {
  it("EXERCISE / atomic (data.js:89)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: CUID_PRIMARY },
      }).success,
    ).toBe(true);
  });

  it("REST_SLOT (data.js:323-328 — EMOM rest minute)", () => {
    expect(schemaRowPayloadSchema.safeParse({ rowKind: "REST_SLOT" }).success).toBe(true);
  });

  it("FOOTNOTE target=each_set empty content (data.js:102-112 — C0-004)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "FOOTNOTE",
        marker: "*",
        target: "each_set",
        content: { elements: [] },
      }).success,
    ).toBe(true);
  });

  it("FOOTNOTE target=each_round with 2 elements", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "FOOTNOTE",
        marker: "*",
        target: "each_round",
        content: {
          elements: [
            { exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 5 } },
            { exerciseId: CUID_SECONDARY, reps: { kind: "count", value: 3 } },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("STANDALONE_LOAD applies_to_all_preceding_rows (data.js:178-189 — Mon M/F 24/16)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_LOAD",
        load: {
          kind: "absolute",
          weight: { variant: "dual_value", first: 24, second: 16, resolver: "athlete_profile" },
        },
        scope: "applies_to_all_preceding_rows",
      }).success,
    ).toBe(true);
  });

  it("STANDALONE_URL whole_schema (data.js:247-255 — Fran URL)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_URL",
        url: "https://example.com/demo/fran",
        wrapped: true,
        appliesTo: "whole_schema",
      }).success,
    ).toBe(true);
  });

  it("PLACEHOLDER muscle_group_reference (data.js:548-558 — Thu SHOULDER mobility)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: "muscle_group_reference",
          text: "any SHOULDER mobility drill (3 min)",
        },
      }).success,
    ).toBe(true);
  });

  it("REP_DEFINITION inline_equality (data.js:296-309 — Mon EMOM T2B 10 = 8 strict + 2 L-sit)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "REP_DEFINITION",
        equality: {
          form: "inline_equality",
          totalReps: 10,
          composition: [
            { exerciseId: CUID_PRIMARY, count: 8 },
            { exerciseId: CUID_SECONDARY, count: 2 },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("INNER_LADDER_MARKER synthetic (contract has shape — no data.js sample)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "INNER_LADDER_MARKER",
        steps: [21, 15, 9],
      }).success,
    ).toBe(true);
  });
});
