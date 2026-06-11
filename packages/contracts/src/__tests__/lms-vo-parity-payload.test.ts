import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../entities/lms/schema-row";

import { CUID_PRIMARY } from "./_cuid-helper";

describe("LMS schemaRowPayload parity — 4 surviving RowKinds", () => {
  it("EXERCISE / atomic (data.js:89)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: CUID_PRIMARY },
      }).success,
    ).toBe(true);
  });

  it("REST (parsed rest spec)", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "REST",
        raw: "2 min",
        parsed: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
  });

  it("REST_SLOT (data.js:323-328 — EMOM rest minute)", () => {
    expect(schemaRowPayloadSchema.safeParse({ rowKind: "REST_SLOT" }).success).toBe(true);
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

  it("rejects the dropped FOOTNOTE kind", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "FOOTNOTE",
        marker: "*",
        target: "each_set",
        content: { elements: [] },
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped STANDALONE_LOAD kind", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_LOAD",
        load: { kind: "bodyweight" },
        scope: "applies_to_all_preceding_rows",
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped STANDALONE_URL kind", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "STANDALONE_URL",
        url: "https://example.com/demo/fran",
        wrapped: true,
        appliesTo: "whole_schema",
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped REP_DEFINITION kind", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "REP_DEFINITION",
        equality: {
          form: "inline_equality",
          totalReps: 10,
          composition: [{ exerciseId: CUID_PRIMARY, count: 8 }],
        },
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped INNER_LADDER_MARKER kind", () => {
    expect(
      schemaRowPayloadSchema.safeParse({
        rowKind: "INNER_LADDER_MARKER",
        steps: [21, 15, 9],
      }).success,
    ).toBe(false);
  });
});
