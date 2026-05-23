import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../entities/lms/schema-row";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

describe("LMS schemaRowPayload — rejection coverage", () => {
  describe("Discriminator", () => {
    it("rejects payload with rowKind: 'UNKNOWN_KIND'", () => {
      expect(schemaRowPayloadSchema.safeParse({ rowKind: "UNKNOWN_KIND" }).success).toBe(false);
    });

    it("rejects payload missing rowKind discriminator entirely", () => {
      expect(schemaRowPayloadSchema.safeParse({}).success).toBe(false);
    });

    it("rejects lowercase rowKind (case-sensitive enum)", () => {
      expect(schemaRowPayloadSchema.safeParse({ rowKind: "exercise" }).success).toBe(false);
    });
  });

  describe("EXERCISE", () => {
    it("rejects EXERCISE payload missing exercise field", () => {
      expect(schemaRowPayloadSchema.safeParse({ rowKind: "EXERCISE" }).success).toBe(false);
    });

    it("rejects EXERCISE with unknown exercise.form discriminator", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "EXERCISE",
          exercise: { form: "MYSTERY", exerciseId: CUID_PRIMARY },
        }).success,
      ).toBe(false);
    });

    it("documents .strip() passthrough: EXERCISE with extra REST shape fields ACCEPTS (Zod default; QA-002)", () => {
      const result = schemaRowPayloadSchema.safeParse({
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: CUID_PRIMARY },
        raw: "leftover REST string",
        parsed: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual({
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: CUID_PRIMARY },
        });
      }
    });
  });

  describe("REST", () => {
    it("rejects REST with empty raw string (min(1))", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "REST",
          raw: "",
          parsed: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
        }).success,
      ).toBe(false);
    });

    it("rejects REST with parsed.scope unknown (propagates from restSpecSchema)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "REST",
          raw: "2 min",
          parsed: { duration: { value: 2, unit: "min" }, scope: "BOGUS_SCOPE" },
        }).success,
      ).toBe(false);
    });
  });

  describe("FOOTNOTE", () => {
    it("rejects FOOTNOTE with marker '***' (only '*' and '**' allowed)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "FOOTNOTE",
          marker: "***",
          target: "each_set",
          content: { elements: [] },
        }).success,
      ).toBe(false);
    });

    it("rejects FOOTNOTE with target not in enum", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "every_other_set",
          content: { elements: [] },
        }).success,
      ).toBe(false);
    });

    it("rejects FOOTNOTE with stringified elements (must be array)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_set",
          content: { elements: "not an array" },
        }).success,
      ).toBe(false);
    });

    it("rejects FOOTNOTE missing elements field on content", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_set",
          content: {},
        }).success,
      ).toBe(false);
    });

    it("rejects FOOTNOTE typeLabel as empty string (min(1) when set)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_set",
          content: { elements: [] },
          typeLabel: "",
        }).success,
      ).toBe(false);
    });
  });

  describe("STANDALONE_LOAD", () => {
    it("rejects STANDALONE_LOAD with load.kind unknown (propagates from loadSchema)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "STANDALONE_LOAD",
          load: { kind: "MYSTERY" },
          scope: "applies_to_all_preceding_rows",
        }).success,
      ).toBe(false);
    });

    it("rejects STANDALONE_LOAD with unknown scope", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "STANDALONE_LOAD",
          load: { kind: "bodyweight" },
          scope: "applies_to_next_row",
        }).success,
      ).toBe(false);
    });
  });

  describe("PLACEHOLDER", () => {
    it("rejects PLACEHOLDER with placeholderKind unknown", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "PLACEHOLDER",
          placeholder: { placeholderKind: "spirit_animal", text: "lion" },
        }).success,
      ).toBe(false);
    });

    it("rejects PLACEHOLDER with empty text (min(1))", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "PLACEHOLDER",
          placeholder: { placeholderKind: "muscle_group_reference", text: "" },
        }).success,
      ).toBe(false);
    });
  });

  describe("INNER_LADDER_MARKER", () => {
    it("rejects INNER_LADDER_MARKER with empty steps array (min(1))", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "INNER_LADDER_MARKER",
          steps: [],
        }).success,
      ).toBe(false);
    });

    it("rejects INNER_LADDER_MARKER with negative step", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "INNER_LADDER_MARKER",
          steps: [21, -1, 9],
        }).success,
      ).toBe(false);
    });

    it("rejects INNER_LADDER_MARKER with non-integer step", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "INNER_LADDER_MARKER",
          steps: [21, 12.5, 9],
        }).success,
      ).toBe(false);
    });
  });

  describe("REP_DEFINITION", () => {
    it("rejects REP_DEFINITION with empty composition array (min(1))", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "REP_DEFINITION",
          equality: {
            form: "inline_equality",
            totalReps: 10,
            composition: [],
          },
        }).success,
      ).toBe(false);
    });

    it("rejects REP_DEFINITION with non-cuid exerciseId in composition element", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "REP_DEFINITION",
          equality: {
            form: "inline_equality",
            totalReps: 10,
            composition: [
              { exerciseId: "not-a-cuid", count: 5 },
              { exerciseId: CUID_SECONDARY, count: 5 },
            ],
          },
        }).success,
      ).toBe(false);
    });

    it("rejects REP_DEFINITION with curly_brace form (only inline_equality allowed at payload)", () => {
      expect(
        schemaRowPayloadSchema.safeParse({
          rowKind: "REP_DEFINITION",
          equality: {
            form: "curly_brace",
            composition: [{ exerciseId: CUID_PRIMARY, count: 3 }],
          },
        }).success,
      ).toBe(false);
    });
  });
});
