import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById, formatRow } from "./format-row";
import { buildExercise } from "./format-row-builders";
import {
  ID_BACK_SQUAT,
  ID_DEADLIFT,
  ID_MISS,
  baseRowFields,
  exerciseById,
  makeExercise,
  makeExerciseRow,
} from "./format-row.fixtures";

const ID_PLACEHOLDER_ATOMIC = "ckplaceh1234567890abcdef01";
const PLACEHOLDER_CANONICAL_NAME = "Any squat";
const PLACEHOLDER_DEMO_URL = "https://example.com/should-not-render.mp4";

const exerciseByIdWithPlaceholder: ExerciseById = new Map([
  ...exerciseById,
  [
    ID_PLACEHOLDER_ATOMIC,
    makeExercise({
      id: ID_PLACEHOLDER_ATOMIC,
      canonicalName: PLACEHOLDER_CANONICAL_NAME,
      canonicalCompoundType: "PLACEHOLDER",
      placeholderFlag: true,
      defaultDemoUrls: [PLACEHOLDER_DEMO_URL],
    }),
  ],
]);

describe("EXERCISE builder permutations", () => {
  it("returns null demoUrl when atomic exercise lookup misses", () => {
    const row = makeExerciseRow({
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_MISS } },
    });
    const result = formatRow(row, exerciseById, 0);

    expect(result.mainText).toBe("—");
    expect(result.demoUrl).toBeNull();
  });

  it("renders 'compound' formPillText and joined elements for compound form", () => {
    const row = makeExerciseRow({
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: {
          form: "compound",
          compound: {
            elements: [
              { exerciseId: ID_BACK_SQUAT, reps: { kind: "count", value: 5 } },
              { exerciseId: ID_DEADLIFT, reps: { kind: "count", value: 3 } },
            ],
          },
        },
      },
    });
    const result = formatRow(row, exerciseById, 0);

    expect(result.mainText).toBe("Back Squat × 5 reps + Deadlift × 3 reps");
    expect(result.formPillText).toBe("compound");
    expect(result.demoUrl).toBeNull();
    expect(result.subParts).toContain("compound row");
  });

  it("pushes reps, load, side, tempo, position, intensity, sequence sub-parts when present", () => {
    const row = makeExerciseRow({
      reps: { kind: "count", value: 5 },
      load: { kind: "bodyweight" },
      side: { kind: "each_leg" },
      tempo: { fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 } },
      position: "NEUTRAL_GRIP",
      intensity: { rpe: { value: 8 } },
      sequence: { kind: "after_each_round" },
    });
    const result = formatRow(row, exerciseById, 0);

    expect(result.subParts).toEqual([
      "5 reps",
      "BW",
      "each leg",
      "Tempo 3-1-1-0",
      "neutral grip",
      "RPE 8",
      "after each round",
    ]);
  });
});

describe("REST builder", () => {
  it("delegates mainText to formatRestSpec when parsed yields a non-empty string", () => {
    const row: SchemaRow = {
      ...baseRowFields,
      rowKind: "REST",
      rowPayload: {
        rowKind: "REST",
        raw: "raw-fallback",
        parsed: { duration: { value: 60, unit: "sec" }, scope: "between_rounds" },
      },
    };

    const result = formatRow(row, exerciseById, 0);

    expect(result.mainText).toBe("rest 60s between rounds");
  });
});

describe("EXERCISE builder with placeholderFlag atomic", () => {
  const makePlaceholderAtomicRow = (): SchemaRow =>
    makeExerciseRow({
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
      },
    });

  it("sets formPillText to placeholder ref when atomic form points to placeholderFlag exercise", () => {
    const row = makePlaceholderAtomicRow();
    const result = buildExercise(
      row,
      { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
      exerciseByIdWithPlaceholder,
      0,
    );

    expect(result.formPillText).toBe("placeholder ref");
  });

  it("sets dashed: true when atomic form points to placeholderFlag exercise", () => {
    const row = makePlaceholderAtomicRow();
    const result = buildExercise(
      row,
      { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
      exerciseByIdWithPlaceholder,
      0,
    );

    expect(result.dashed).toBe(true);
  });

  it("sets demoUrl: null when atomic form points to placeholderFlag exercise", () => {
    const row = makePlaceholderAtomicRow();
    const result = buildExercise(
      row,
      { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
      exerciseByIdWithPlaceholder,
      0,
    );

    expect(result.demoUrl).toBeNull();
  });

  it("propagates placeholder sub via subParts when atomic form points to placeholderFlag exercise", () => {
    const row = makePlaceholderAtomicRow();
    const result = buildExercise(
      row,
      { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC },
      exerciseByIdWithPlaceholder,
      0,
    );

    expect(result.subParts).toContain("placeholder");
  });
});
