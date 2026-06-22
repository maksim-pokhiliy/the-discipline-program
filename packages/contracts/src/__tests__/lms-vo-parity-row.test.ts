import { describe, expect, it } from "vitest";

import {
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "../entities/lms/_shared";

describe("LMS VO parity — prototype data.js edge cases", () => {
  describe("Load", () => {
    it("absolute single-implement (data.js:134 — Mon back squat 60kg)", () => {
      expect(loadSchema.safeParse({ kind: "absolute", count: 1, kg: 60 }).success).toBe(true);
    });

    it("absolute dual-implement (data.js:184 — Mon dumbbell pair 22.5kg)", () => {
      expect(loadSchema.safeParse({ kind: "absolute", count: 2, kg: 22.5 }).success).toBe(true);
    });

    it("byProfile Male/Female 24/16 (data.js:184 — Mon M/F dumbbell pair, ex-dual_value)", () => {
      expect(
        loadSchema.safeParse({
          kind: "byProfile",
          axes: [{ kind: "human", attribute: "gender" }],
          cells: [
            { coords: ["Male"], kg: 24 },
            { coords: ["Female"], kg: 16 },
          ],
        }).success,
      ).toBe(true);
    });

    it("percentage with value + rangeMax + self ref (data.js:91 — Mon back squat 60-85%)", () => {
      expect(
        loadSchema.safeParse({
          kind: "percentage",
          value: 60,
          rangeMax: 85,
          reference: { scope: "self" },
        }).success,
      ).toBe(true);
    });

    it("bodyweight (data.js:426 — Tue burpee)", () => {
      expect(loadSchema.safeParse({ kind: "bodyweight" }).success).toBe(true);
    });

    it("rejects the dropped none kind (data.js:651 — ex-unspecified, now bodyweight)", () => {
      expect(loadSchema.safeParse({ kind: "none" }).success).toBe(false);
    });
  });

  describe("RepNotation", () => {
    it("count (data.js:90)", () => {
      expect(repNotationSchema.safeParse({ kind: "count", value: 5 }).success).toBe(true);
    });

    it("range (data.js:489 — Thu C2B 5-8)", () => {
      expect(repNotationSchema.safeParse({ kind: "range", min: 5, max: 8 }).success).toBe(true);
    });

    it("unit_bound sec (data.js:410)", () => {
      expect(
        repNotationSchema.safeParse({ kind: "unit_bound", unit: "sec", value: 15 }).success,
      ).toBe(true);
    });

    it("unit_bound km / fractional (data.js:515 — Thu HS walk 15m)", () => {
      expect(
        repNotationSchema.safeParse({ kind: "unit_bound", unit: "km", value: 0.015 }).success,
      ).toBe(true);
    });

    it("max bare (data.js:367 — Tue deadlift wave top set)", () => {
      expect(repNotationSchema.safeParse({ kind: "max" }).success).toBe(true);
    });

    it("max with free-text tail (data.js:650 — Fri snatch progression, ex-progressiveSeed)", () => {
      expect(repNotationSchema.safeParse({ kind: "max", tail: "3-3-3-2-2-1-1" }).success).toBe(
        true,
      );
    });
  });

  describe("PerLimbDistribution", () => {
    it("each_leg with countPerLimb (data.js:135 — Mon split squat)", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "each_leg", countPerLimb: 8 }).success,
      ).toBe(true);
    });

    it("each_arm with countPerLimb (data.js:161 — Mon DB row)", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "each_arm", countPerLimb: 10 }).success,
      ).toBe(true);
    });

    it("alternating with sourceAnnotation (data.js:419 — Tue DB snatch)", () => {
      expect(
        perLimbDistributionSchema.safeParse({ kind: "alternating", sourceAnnotation: "alt." })
          .success,
      ).toBe(true);
    });
  });

  describe("TempoModifier", () => {
    it("full-tempo quad with explosive X concentric (data.js:93 — Mon back squat)", () => {
      expect(
        tempoModifierSchema.safeParse({
          eccentric: 3,
          pauseBottom: 1,
          concentric: "X",
          pauseTop: 0,
        }).success,
      ).toBe(true);
    });

    it("accepts a bare verbal string (the free-text arm)", () => {
      expect(tempoModifierSchema.safeParse("slow eccentric").success).toBe(true);
    });

    it("rejects the dropped verbal slowEccentric form (data.js:653 — Fri snatch)", () => {
      expect(tempoModifierSchema.safeParse({ slowEccentric: { durationSec: 3 } }).success).toBe(
        false,
      );
    });
  });

  describe("Intensity", () => {
    it("effortPercent.value alone (data.js:60)", () => {
      expect(intensitySchema.safeParse({ effortPercent: { value: 80 } }).success).toBe(true);
    });

    it("effortPercent + rpe composite (data.js:58-61 — Mon block 1)", () => {
      expect(
        intensitySchema.safeParse({
          effortPercent: { value: 80 },
          rpe: { value: 7 },
        }).success,
      ).toBe(true);
    });

    it("rpe + hrZone composite (data.js:204 — Mon block 2)", () => {
      expect(
        intensitySchema.safeParse({
          rpe: { value: 8 },
          hrZone: { zone: "Z4" },
        }).success,
      ).toBe(true);
    });

    it("hrZone alone (data.js:612 — Fri Z2 run)", () => {
      expect(intensitySchema.safeParse({ hrZone: { zone: "Z2" } }).success).toBe(true);
    });

    it("numericPace + hrZone (data.js:628 — Fri Z2 run pace)", () => {
      expect(
        intensitySchema.safeParse({
          numericPace: {
            value: "5:00",
            distanceUnit: "km",
            paceType: "min_per_distance",
          },
          hrZone: { zone: "Z2" },
        }).success,
      ).toBe(true);
    });
  });

  describe("TimeCap", () => {
    it("min only (data.js:206 — Mon Fran 12 min cap)", () => {
      expect(timeCapSchema.safeParse({ min: 12, unit: "min" }).success).toBe(true);
    });
  });

  describe("RestSpec", () => {
    it("between_sets 150 sec (data.js:80 — Mon back squat)", () => {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 150, unit: "sec" },
          scope: "between_sets",
        }).success,
      ).toBe(true);
    });

    it("between_rounds 60 sec (data.js:474 — Thu super-set rest)", () => {
      expect(
        restSpecSchema.safeParse({
          duration: { value: 60, unit: "sec" },
          scope: "between_rounds",
        }).success,
      ).toBe(true);
    });
  });

  describe("MediaReference", () => {
    it("url only (data.js:227 — Mon Fran thruster URL)", () => {
      expect(
        mediaReferenceSchema.safeParse({ url: "https://example.com/demo/thruster" }).success,
      ).toBe(true);
    });

    it("url + label", () => {
      expect(
        mediaReferenceSchema.safeParse({
          url: "https://example.com/demo/thruster",
          label: "thruster demo",
        }).success,
      ).toBe(true);
    });
  });
});
