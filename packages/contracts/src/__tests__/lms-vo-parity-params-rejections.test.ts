import { describe, expect, it } from "vitest";

import { archetypeParamsSchema } from "../entities/lms/schema";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

describe("LMS archetypeParams — rejection coverage (core archetypes)", () => {
  describe("Discriminator", () => {
    it("rejects unknown archetype discriminator", () => {
      expect(archetypeParamsSchema.safeParse({ archetype: "MYSTERY", params: {} }).success).toBe(
        false,
      );
    });

    it("rejects empty-param archetype with extra keys (emptyParamsSchema is .strict())", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "single-line-bare",
          params: { rogue: 1 },
        }).success,
      ).toBe(false);
    });
  });

  describe("n-rounds", () => {
    it("rejects n-rounds with countForm unknown", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { countForm: "MYSTERY", count: 5 },
        }).success,
      ).toBe(false);
    });

    it("rejects n-rounds with negative count", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { countForm: "exact", count: -5 },
        }).success,
      ).toBe(false);
    });

    it("rejects n-rounds with zero count", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { countForm: "exact", count: 0 },
        }).success,
      ).toBe(false);
    });

    it("rejects n-rounds with non-integer count", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { countForm: "exact", count: 5.5 },
        }).success,
      ).toBe(false);
    });

    it("rejects n-rounds with countRange.min >= countRange.max", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { countForm: "range", countRange: { min: 5, max: 5 } },
        }).success,
      ).toBe(false);
    });
  });

  describe("ladder-descending", () => {
    it("rejects ladder-descending with non-integer step", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "ladder-descending",
          params: { steps: [21, 12.5, 9] },
        }).success,
      ).toBe(false);
    });

    it("rejects ladder-descending with negative step", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "ladder-descending",
          params: { steps: [21, -1, 9] },
        }).success,
      ).toBe(false);
    });

    it("rejects ladder-descending with empty steps array (min(1) lower bound)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "ladder-descending",
          params: { steps: [] },
        }).success,
      ).toBe(false);
    });
  });

  describe("super-set", () => {
    it("rejects super-set with empty pairs array (min(1) lower bound)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "super-set",
          params: { pairs: [], rounds: 5 },
        }).success,
      ).toBe(false);
    });

    it("rejects super-set with pair.label empty string (min(1))", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "super-set",
          params: {
            pairs: [{ label: "", schemaRows: [CUID_PRIMARY] }],
            rounds: 5,
          },
        }).success,
      ).toBe(false);
    });

    it("rejects super-set with rounds: 0 (must be positive)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "super-set",
          params: {
            pairs: [{ label: "A", schemaRows: [CUID_PRIMARY] }],
            rounds: 0,
          },
        }).success,
      ).toBe(false);
    });

    it("rejects super-set with non-cuid in pair.schemaRows", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "super-set",
          params: {
            pairs: [{ label: "A", schemaRows: ["not-a-cuid"] }],
            rounds: 5,
          },
        }).success,
      ).toBe(false);
    });
  });

  describe("Cross-variant", () => {
    it("rejects n-rounds with amrap durationMin (cross-variant param mismatch)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "n-rounds",
          params: { durationMin: 10 },
        }).success,
      ).toBe(false);
    });

    it("rejects single-line-total-counter with totalFlag: false (must be literal true)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "single-line-total-counter",
          params: { totalFlag: false },
        }).success,
      ).toBe(false);
    });

    it("documents .strip() passthrough on super-set params: extra key ACCEPTED (only empty-param archetypes use .strict(); tracked under QA-002)", () => {
      const result = archetypeParamsSchema.safeParse({
        archetype: "super-set",
        params: {
          pairs: [{ label: "A", schemaRows: [CUID_SECONDARY] }],
          rounds: 5,
          mystery: true,
        },
      });

      expect(result.success).toBe(true);

      if (result.success && result.data.archetype === "super-set") {
        expect(result.data.params).not.toHaveProperty("mystery");
      }
    });
  });
});
