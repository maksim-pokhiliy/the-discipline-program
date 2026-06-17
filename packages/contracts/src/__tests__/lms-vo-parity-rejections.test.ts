import { describe, expect, it } from "vitest";

import {
  loadSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
} from "../entities/lms/_shared";

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

    it("rejects byProfile with a non-positive cell kg", () => {
      expect(
        loadSchema.safeParse({
          kind: "byProfile",
          axes: [{ name: "sex", values: ["M"] }],
          cells: [{ coords: ["M"], kg: 0 }],
        }).success,
      ).toBe(false);
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
    it("accepts a bare verbal string (the free-text arm)", () => {
      expect(tempoModifierSchema.safeParse("slow eccentric").success).toBe(true);
    });

    it("rejects the dropped verbal-form wrapper object", () => {
      expect(tempoModifierSchema.safeParse({ pauseInUp: { durationSec: 2 } }).success).toBe(false);
    });

    it("rejects a quad with eccentric > 60 (max-clamp)", () => {
      expect(
        tempoModifierSchema.safeParse({
          eccentric: 61,
          pauseBottom: 0,
          concentric: 0,
          pauseTop: 0,
        }).success,
      ).toBe(false);
    });

    it("rejects a quad with a non-integer numeric field", () => {
      expect(
        tempoModifierSchema.safeParse({
          eccentric: 3.5,
          pauseBottom: 0,
          concentric: 0,
          pauseTop: 0,
        }).success,
      ).toBe(false);
    });

    it("rejects a quad missing a position field", () => {
      expect(
        tempoModifierSchema.safeParse({ eccentric: 3, pauseBottom: 0, concentric: 0 }).success,
      ).toBe(false);
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
});
