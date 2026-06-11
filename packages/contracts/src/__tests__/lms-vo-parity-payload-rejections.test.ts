import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../entities/lms/schema-row";

import { CUID_PRIMARY } from "./_cuid-helper";

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
});
