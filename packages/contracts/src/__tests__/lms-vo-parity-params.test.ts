import { describe, expect, it } from "vitest";

import { archetypeParamsSchema } from "../entities/lms/schema";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

describe("LMS archetypeParams parity — variants exercised by data.js", () => {
  it("n-rounds count_times_reps (data.js:76-81 — Mon back squat 5x5)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "n-rounds",
        params: {
          countForm: "count_times_reps",
          count: 5,
          repsPerSet: 5,
          rest: {
            duration: { value: 150, unit: "sec" },
            scope: "between_sets",
          },
        },
      }).success,
    ).toBe(true);
  });

  it("alternating-sets setEnumeration (data.js:124 — Mon [1,3,5])", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "alternating-sets",
        params: { setEnumeration: [1, 3, 5] },
      }).success,
    ).toBe(true);
  });

  it("ladder-descending Fran 21-15-9 (data.js:217)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "ladder-descending",
        params: { steps: [21, 15, 9] },
      }).success,
    ).toBe(true);
  });

  it("emom-nested-per-minute 10 min (data.js:266)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "emom-nested-per-minute",
        params: { durationMin: 10 },
      }).success,
    ).toBe(true);
  });

  it("emom-sub-minute-slot grouped minutes (data.js:278 — [1,3,5,7,9])", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "emom-sub-minute-slot",
        params: { slot: { kind: "grouped", minutes: [1, 3, 5, 7, 9] } },
      }).success,
    ).toBe(true);
  });

  it("amrap-flat 12 min (data.js:404)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "amrap-flat",
        params: { durationMin: 12 },
      }).success,
    ).toBe(true);
  });

  it("named-exercise-program wave (data.js:358-370 — Tue deadlift 5/3/1)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "named-exercise-program",
        params: {
          exerciseId: CUID_PRIMARY,
          program: {
            programKind: "wave",
            stages: [
              {
                reps: { kind: "count", value: 5 },
                load: { kind: "percentage", value: 75, reference: { scope: "self" } },
              },
              {
                reps: { kind: "count", value: 3 },
                load: { kind: "percentage", value: 85, reference: { scope: "self" } },
              },
              {
                reps: { kind: "max", subForm: "bare" },
                load: { kind: "percentage", value: 95, reference: { scope: "self" } },
              },
            ],
          },
        },
      }).success,
    ).toBe(true);
  });

  it("super-set 1-row pairs (data.js:467-475 — C0-005)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "super-set",
        params: {
          rounds: 5,
          pairs: [
            { label: "A", schemaRows: [CUID_PRIMARY] },
            { label: "B", schemaRows: [CUID_SECONDARY] },
          ],
          restBetweenPairs: {
            duration: { value: 60, unit: "sec" },
            scope: "between_rounds",
          },
        },
      }).success,
    ).toBe(true);
  });

  it("run-distance km / integer (data.js:619 — Fri 6km run)", () => {
    expect(
      archetypeParamsSchema.safeParse({
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km", value: 6 } },
      }).success,
    ).toBe(true);
  });

  it("placeholder-body empty params (data.js:545)", () => {
    expect(
      archetypeParamsSchema.safeParse({ archetype: "placeholder-body", params: {} }).success,
    ).toBe(true);
  });

  it("practice-list empty params (data.js:642)", () => {
    expect(
      archetypeParamsSchema.safeParse({ archetype: "practice-list", params: {} }).success,
    ).toBe(true);
  });

  it("single-line-bare empty params (data.js:173)", () => {
    expect(
      archetypeParamsSchema.safeParse({ archetype: "single-line-bare", params: {} }).success,
    ).toBe(true);
  });
});
