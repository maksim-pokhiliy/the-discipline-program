import { describe, expect, it } from "vitest";

import { type GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type OneRMRecordView } from "@repo/contracts/lms/records-view";

import { buildMovementOptions } from "./build-movement-options";

const record = (exerciseId: string, exerciseName: string): OneRMRecordView => ({
  exerciseId,
  exerciseName,
  best: 100,
  bestSource: OneRMRecordSource.TESTED,
  bestRecordedAt: "2026-02-01T00:00:00.000Z",
  lastRecordedAt: "2026-02-01T00:00:00.000Z",
  delta: 0,
  recordCount: 1,
  series: [
    {
      valueKg: 100,
      source: OneRMRecordSource.TESTED,
      recordedAt: "2026-02-01T00:00:00.000Z",
      isBest: true,
    },
  ],
});

const catalog = (...entries: [string, string][]): GetAthleteMovementsResponse =>
  entries.map(([id, canonicalName]) => ({ id, canonicalName }));

describe("buildMovementOptions", () => {
  it("offers the whole catalog to an athlete with no records yet", () => {
    expect(buildMovementOptions([], catalog(["ex1", "Deadlift"], ["ex2", "Back Squat"]))).toEqual([
      { exerciseId: "ex2", exerciseName: "Back Squat" },
      { exerciseId: "ex1", exerciseName: "Deadlift" },
    ]);
  });

  it("falls back to the athlete's own movements when the catalog is empty", () => {
    expect(buildMovementOptions([record("ex1", "Snatch")], [])).toEqual([
      { exerciseId: "ex1", exerciseName: "Snatch" },
    ]);
  });

  it("collapses a movement present in both sources into a single option", () => {
    const options = buildMovementOptions(
      [record("ex1", "Back Squat")],
      catalog(["ex1", "Back Squat"], ["ex2", "Deadlift"]),
    );

    expect(options).toEqual([
      { exerciseId: "ex1", exerciseName: "Back Squat" },
      { exerciseId: "ex2", exerciseName: "Deadlift" },
    ]);
  });

  it("keeps a logged movement that the catalog does not offer", () => {
    const options = buildMovementOptions(
      [record("placeholder-1", "Any Squat Variation")],
      catalog(["ex2", "Deadlift"]),
    );

    expect(options.map((option) => option.exerciseId)).toEqual(["placeholder-1", "ex2"]);
  });

  it("sorts the merged list by movement name, not by source", () => {
    const options = buildMovementOptions(
      [record("ex9", "Zercher Squat"), record("ex8", "Clean")],
      catalog(["ex1", "Bench Press"], ["ex2", "Push Press"]),
    );

    expect(options.map((option) => option.exerciseName)).toEqual([
      "Bench Press",
      "Clean",
      "Push Press",
      "Zercher Squat",
    ]);
  });
});
