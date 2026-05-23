import { describe, expect, it } from "vitest";

import { archetypeParamsSchema } from "../entities/lms/schema";

import { CUID_PRIMARY } from "./_cuid-helper";

describe("LMS archetypeParams — rejection coverage (composite / nested / modality)", () => {
  describe("amrap-flat", () => {
    it("rejects amrap-flat with negative durationMin", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "amrap-flat",
          params: { durationMin: -1 },
        }).success,
      ).toBe(false);
    });

    it("rejects amrap-flat with zero durationMin", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "amrap-flat",
          params: { durationMin: 0 },
        }).success,
      ).toBe(false);
    });
  });

  describe("emom-nested-per-minute", () => {
    it("rejects emom-nested-per-minute with negative durationMin", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "emom-nested-per-minute",
          params: { durationMin: -10 },
        }).success,
      ).toBe(false);
    });

    it("rejects emom-nested-per-minute with negative rounds (optional but positive when set)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "emom-nested-per-minute",
          params: { durationMin: 10, rounds: -1 },
        }).success,
      ).toBe(false);
    });
  });

  describe("emom-sub-minute-slot", () => {
    it("rejects emom-sub-minute-slot with grouped slot single-element minutes (min(2))", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "emom-sub-minute-slot",
          params: { slot: { kind: "grouped", minutes: [1] } },
        }).success,
      ).toBe(false);
    });

    it("rejects emom-sub-minute-slot with unknown slot.kind", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "emom-sub-minute-slot",
          params: { slot: { kind: "scattered", minutes: [1, 2] } },
        }).success,
      ).toBe(false);
    });
  });

  describe("time-window-outer", () => {
    it("rejects time-window-outer with malformed startHhMm (regex)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "time-window-outer",
          params: { window: { startHhMm: "morning", endHhMm: "11:00" } },
        }).success,
      ).toBe(false);
    });
  });

  describe("composite-intervals-work-rest-progressive", () => {
    it("rejects with empty progressiveSeed (min(1))", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "composite-intervals-work-rest-progressive",
          params: { sets: 5, workMin: 2, offMin: 1, progressiveSeed: "" },
        }).success,
      ).toBe(false);
    });
  });

  describe("composite-intervals-on-off-max-tail", () => {
    it("rejects with non-cuid tailExerciseId", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "composite-intervals-on-off-max-tail",
          params: { intervals: 3, onMin: 2, offMin: 1, tailExerciseId: "not-a-cuid" },
        }).success,
      ).toBe(false);
    });
  });

  describe("named-exercise-program", () => {
    it("rejects with non-cuid exerciseId", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "named-exercise-program",
          params: {
            exerciseId: "not-a-cuid",
            program: {
              programKind: "wave",
              stages: [{ reps: { kind: "count", value: 5 } }],
            },
          },
        }).success,
      ).toBe(false);
    });

    it("rejects with empty stages array (stagedProgramSchema.stages.min(1))", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "named-exercise-program",
          params: {
            exerciseId: CUID_PRIMARY,
            program: { programKind: "wave", stages: [] },
          },
        }).success,
      ).toBe(false);
    });

    it("rejects with unknown programKind", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "named-exercise-program",
          params: {
            exerciseId: CUID_PRIMARY,
            program: { programKind: "BOGUS", stages: [{ reps: { kind: "count", value: 5 } }] },
          },
        }).success,
      ).toBe(false);
    });
  });

  describe("run-distance", () => {
    it("rejects with modality other than RUN (literal)", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "run-distance",
          params: { modality: "BIKE", distance: { unit: "km", value: 6 } },
        }).success,
      ).toBe(false);
    });

    it("rejects with negative distance value", () => {
      expect(
        archetypeParamsSchema.safeParse({
          archetype: "run-distance",
          params: { modality: "RUN", distance: { unit: "km", value: -1 } },
        }).success,
      ).toBe(false);
    });
  });
});
