import { describe, expect, it } from "vitest";

import {
  exerciseFormSchema,
  loadSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
} from "../entities/lms/_shared";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

describe("LMS VO parity — rejection coverage (negative space)", () => {
  describe("Load", () => {
    it("rejects percentage without value (value is required)", () => {
      expect(
        loadSchema.safeParse({
          kind: "percentage",
          reference: { scope: "self" },
        }).success,
      ).toBe(false);
    });

    it("rejects percentage with rangeMax === value (rangeMax must be > value)", () => {
      expect(
        loadSchema.safeParse({
          kind: "percentage",
          value: 70,
          rangeMax: 70,
          reference: { scope: "self" },
        }).success,
      ).toBe(false);
    });

    it("rejects the dropped without_weight kind", () => {
      expect(loadSchema.safeParse({ kind: "without_weight", context: "warmup" }).success).toBe(
        false,
      );
    });

    it("rejects byProfile with a non-positive value", () => {
      expect(loadSchema.safeParse({ kind: "byProfile", first: 0, second: 16 }).success).toBe(false);
    });
  });

  describe("RepNotation", () => {
    it("rejects range with min === max (must be strictly less)", () => {
      expect(repNotationSchema.safeParse({ kind: "range", min: 5, max: 5 }).success).toBe(false);
    });

    it("rejects unit_bound with both value AND range (XOR refine)", () => {
      expect(
        repNotationSchema.safeParse({
          kind: "unit_bound",
          unit: "sec",
          value: 30,
          range: { min: 20, max: 40 },
        }).success,
      ).toBe(false);
    });

    it("rejects unit_bound with neither value nor range", () => {
      expect(repNotationSchema.safeParse({ kind: "unit_bound", unit: "sec" }).success).toBe(false);
    });

    it("rejects max with an empty tail string (min(1) when set)", () => {
      expect(repNotationSchema.safeParse({ kind: "max", tail: "" }).success).toBe(false);
    });
  });

  describe("PerLimbDistribution", () => {
    it("rejects each_leg with zero countPerLimb (positive int)", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "each_leg", countPerLimb: 0 }).success,
      ).toBe(false);
    });

    it("rejects explicit_split with non left/right side", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "explicit_split", side: "middle" }).success,
      ).toBe(false);
    });

    it("rejects alternating with empty sourceAnnotation (min(1) when set)", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "alternating", sourceAnnotation: "" }).success,
      ).toBe(false);
    });
  });

  describe("TempoModifier", () => {
    it("rejects empty object (at-least-one-axis refine)", () => {
      expect(tempoModifierSchema.safeParse({}).success).toBe(false);
    });

    it("rejects fullTempo with eccentric > 60 (max-clamp)", () => {
      expect(
        tempoModifierSchema.safeParse({
          fullTempo: { eccentric: 61, pauseBottom: 0, concentric: 0, pauseTop: 0 },
        }).success,
      ).toBe(false);
    });

    it("rejects fullTempo with non-integer field", () => {
      expect(
        tempoModifierSchema.safeParse({
          fullTempo: { eccentric: 3.5, pauseBottom: 0, concentric: 0, pauseTop: 0 },
        }).success,
      ).toBe(false);
    });

    it("rejects pauseInUp with negative durationSec", () => {
      expect(tempoModifierSchema.safeParse({ pauseInUp: { durationSec: -1 } }).success).toBe(false);
    });
  });

  describe("RestSpec", () => {
    it("rejects range_sec without rangeMax (rangeMax required for range_*)", () => {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 30, unit: "range_sec" },
          scope: "between_sets",
        }).success,
      ).toBe(false);
    });

    it("rejects sec WITH rangeMax (rangeMax forbidden when unit != range_*)", () => {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 30, unit: "sec", rangeMax: 60 },
          scope: "between_sets",
        }).success,
      ).toBe(false);
    });

    it("rejects unknown duration.unit (enum violation)", () => {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 30, unit: "hours" },
          scope: "between_sets",
        }).success,
      ).toBe(false);
    });
  });

  describe("ExerciseForm", () => {
    it("rejects atomic form with non-cuid exerciseId", () => {
      expect(
        exerciseFormSchema.safeParse({ form: "atomic", exerciseId: "not-a-cuid" }).success,
      ).toBe(false);
    });

    it("rejects compound form with 1-element compound (semantic = atomic)", () => {
      expect(
        exerciseFormSchema.safeParse({
          form: "compound",
          compound: { elements: [{ exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 5 } }] },
        }).success,
      ).toBe(false);
    });

    it("rejects sandwich with missing middle element", () => {
      expect(
        exerciseFormSchema.safeParse({
          form: "sandwich",
          sandwich: {
            opening: { exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 12 } },
            closing: { exerciseId: CUID_SECONDARY, reps: { kind: "count", value: 6 } },
          },
        }).success,
      ).toBe(false);
    });

    it("documents .strip() passthrough: atomic with extra compound fields ACCEPTS (Zod default; tracked under QA-002 for .strict() posture)", () => {
      const result = exerciseFormSchema.safeParse({
        form: "atomic",
        exerciseId: CUID_PRIMARY,
        compound: {
          elements: [
            { exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 5 } },
            { exerciseId: CUID_SECONDARY, reps: { kind: "count", value: 5 } },
          ],
        },
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual({ form: "atomic", exerciseId: CUID_PRIMARY });
      }
    });
  });
});
