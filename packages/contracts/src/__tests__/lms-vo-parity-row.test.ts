import { describe, expect, it } from "vitest";

import {
  exerciseFormSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "../entities/lms/_shared";

import { CUID_PRIMARY, CUID_SECONDARY, CUID_TERTIARY } from "./_cuid-helper";

describe("LMS VO parity — prototype data.js edge cases", () => {
  describe("Load", () => {
    it("absolute / single", () => {
      expect(
        loadSchema.safeParse({
          kind: "absolute",
          weight: { variant: "single", valueKg: 60 },
        }).success,
      ).toBe(true);
    });

    it("absolute / dual (data.js:134 — Mon Bulgarian split squat 24kg)", () => {
      expect(
        loadSchema.safeParse({
          kind: "absolute",
          weight: { variant: "dual", valueKg: 24 },
        }).success,
      ).toBe(true);
    });

    it("absolute / single_arm (data.js:160 — Mon DB row 22.5kg)", () => {
      expect(
        loadSchema.safeParse({
          kind: "absolute",
          weight: { variant: "single_arm", valueKg: 22.5 },
        }).success,
      ).toBe(true);
    });

    it("absolute / dual_value M/F 24/16 (data.js:184 — Mon STANDALONE_LOAD)", () => {
      expect(
        loadSchema.safeParse({
          kind: "absolute",
          weight: { variant: "dual_value", first: 24, second: 16, resolver: "athlete_profile" },
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

    it("unspecified (data.js:651 — Fri snatch warm-up)", () => {
      expect(loadSchema.safeParse({ kind: "unspecified" }).success).toBe(true);
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

    it("max bare (data.js:367 — Tue deadlift wave stage 3)", () => {
      expect(repNotationSchema.safeParse({ kind: "max", subForm: "bare" }).success).toBe(true);
    });

    it("max progressive + progressiveSeed (data.js:650 — Fri snatch)", () => {
      expect(
        repNotationSchema.safeParse({
          kind: "max",
          subForm: "progressive",
          progressiveSeed: "3-3-3-2-2-1-1",
        }).success,
      ).toBe(true);
    });

    it("implicit (data.js:224 — Mon Fran ladder)", () => {
      expect(repNotationSchema.safeParse({ kind: "implicit" }).success).toBe(true);
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
    it("fullTempo with concentric=0 / X explosive (data.js:93 — Mon back squat)", () => {
      expect(
        tempoModifierSchema.safeParse({
          fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 },
        }).success,
      ).toBe(true);
    });

    it("slowEccentric (data.js:653 — Fri snatch)", () => {
      expect(tempoModifierSchema.safeParse({ slowEccentric: { durationSec: 3 } }).success).toBe(
        true,
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
    it("inline / current_row (data.js:227 — Mon Fran thruster URL)", () => {
      expect(
        mediaReferenceSchema.safeParse({
          url: "https://example.com/demo/thruster",
          position: "inline",
          appliesTo: "current_row",
        }).success,
      ).toBe(true);
    });
  });

  describe("ExerciseForm", () => {
    it("atomic (data.js:89 — Mon back squat)", () => {
      expect(
        exerciseFormSchema.safeParse({ form: "atomic", exerciseId: CUID_PRIMARY }).success,
      ).toBe(true);
    });

    it("compound 2-element (data.js:579-587 — Thu push-up + air squat)", () => {
      expect(
        exerciseFormSchema.safeParse({
          form: "compound",
          compound: {
            elements: [
              { exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 10 } },
              { exerciseId: CUID_SECONDARY, reps: { kind: "count", value: 15 } },
            ],
          },
        }).success,
      ).toBe(true);
    });

    it("sandwich with sharedModifiers.load dual_value (data.js:694-708 — Sat DT)", () => {
      expect(
        exerciseFormSchema.safeParse({
          form: "sandwich",
          sandwich: {
            opening: { exerciseId: CUID_PRIMARY, reps: { kind: "count", value: 12 } },
            middle: { exerciseId: CUID_SECONDARY, reps: { kind: "count", value: 9 } },
            closing: { exerciseId: CUID_TERTIARY, reps: { kind: "count", value: 6 } },
            sharedModifiers: {
              load: {
                kind: "absolute",
                weight: {
                  variant: "dual_value",
                  first: 70,
                  second: 47,
                  resolver: "athlete_profile",
                },
              },
            },
          },
        }).success,
      ).toBe(true);
    });

    it("or_alternative purpose=scale_down (data.js:521-535 — Thu HSPU OR push-up)", () => {
      expect(
        exerciseFormSchema.safeParse({
          form: "or_alternative",
          orAlternative: {
            primaryExerciseId: CUID_PRIMARY,
            primaryReps: { kind: "count", value: 5 },
            alternativeExerciseId: CUID_SECONDARY,
            alternativeReps: { kind: "count", value: 10 },
            purpose: "scale_down",
          },
        }).success,
      ).toBe(true);
    });
  });
});
