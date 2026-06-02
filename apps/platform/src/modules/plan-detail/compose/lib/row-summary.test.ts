import { describe, expect, it } from "vitest";

import type { Load, RepNotation } from "@repo/contracts/lms/_shared";

import { MOCK_EXERCISES, MOCK_EXERCISE_IDS } from "../compose-mock-exercises";
import { atomicExercise, compoundExercise, exerciseRow, restRow } from "../compose-mock-rows";

import { buildRowSummary } from "./row-summary";

const exerciseById = new Map(MOCK_EXERCISES.map((exercise) => [exercise.id, exercise]));
const nameOf = (id: string): string => exerciseById.get(id)?.canonicalName ?? "";

const KG_24: Load = { kind: "absolute", weight: { variant: "single", valueKg: 24 } };
const COUNT_10: RepNotation = { kind: "count", value: 10 };
const IMPLICIT: RepNotation = { kind: "implicit" };

describe("buildRowSummary", () => {
  it("renders an atomic exercise as name then load then reps", () => {
    const row = exerciseRow("t-atomic", {
      exercise: atomicExercise(MOCK_EXERCISE_IDS.kettlebellSwing),
      load: KG_24,
      reps: COUNT_10,
    });

    const summary = buildRowSummary(row, exerciseById);

    expect(summary.badge.label).toBe("EX");
    expect(summary.label).toBe(`${nameOf(MOCK_EXERCISE_IDS.kettlebellSwing)} · 24 kg · 10 reps`);
  });

  it("renders a compound exercise with per-element reps and names", () => {
    const row = exerciseRow("t-compound", {
      exercise: compoundExercise([
        { exerciseId: MOCK_EXERCISE_IDS.pullUp, reps: { kind: "count", value: 5 } },
        { exerciseId: MOCK_EXERCISE_IDS.dip, reps: { kind: "count", value: 10 } },
      ]),
    });

    expect(buildRowSummary(row, exerciseById).label).toBe(
      `5 ${nameOf(MOCK_EXERCISE_IDS.pullUp)} + 10 ${nameOf(MOCK_EXERCISE_IDS.dip)}`,
    );
  });

  it("hides implicit reps so a container-driven scheme is not duplicated on the row", () => {
    const row = exerciseRow("t-implicit", {
      exercise: atomicExercise(MOCK_EXERCISE_IDS.thrusters),
      load: KG_24,
      reps: IMPLICIT,
    });

    expect(buildRowSummary(row, exerciseById).label).toBe(
      `${nameOf(MOCK_EXERCISE_IDS.thrusters)} · 24 kg`,
    );
  });

  it("renders a rest row as its raw duration with the RST badge", () => {
    const summary = buildRowSummary(restRow("t-rest", 60), exerciseById);

    expect(summary.badge.label).toBe("RST");
    expect(summary.label).toBe("60 sec");
  });
});
