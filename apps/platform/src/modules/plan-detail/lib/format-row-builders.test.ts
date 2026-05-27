import { describe, expect, it } from "vitest";

import type { SchemaRow, SchemaRowPayload } from "@repo/contracts/lms/schema-row";

import { type ExerciseById, formatRow } from "./format-row";
import { buildExercise, buildInnerLadderMarker, buildStandaloneLoad } from "./format-row-builders";
import {
  ID_BACK_SQUAT,
  ID_DEADLIFT,
  ID_MISS,
  baseRowFields,
  exerciseById,
  makeExercise,
  makeExerciseRow,
  makeFootnoteRow,
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

const makeStandaloneLoadPayload = (): Extract<
  SchemaRowPayload,
  { rowKind: "STANDALONE_LOAD" }
> => ({
  rowKind: "STANDALONE_LOAD",
  load: { kind: "absolute", weight: { variant: "single", valueKg: 20 } },
  scope: "applies_to_all_preceding_rows",
});

const makeInnerLadderMarkerPayload = (
  steps: number[],
): Extract<SchemaRowPayload, { rowKind: "INNER_LADDER_MARKER" }> => ({
  rowKind: "INNER_LADDER_MARKER",
  steps,
});

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

describe("FOOTNOTE builder", () => {
  it("falls back to row notes when content has no elements", () => {
    const row = makeFootnoteRow({
      notes: "as feels",
      rowPayload: {
        rowKind: "FOOTNOTE",
        marker: "**",
        target: "each_set",
        content: { elements: [] },
      },
    });

    const result = formatRow(row, exerciseById, 0);

    expect(result.mainText).toBe("** as feels (each set)");
    expect(result.ord).toBe("**");
  });
});

describe("STANDALONE_URL builder", () => {
  it("renders 'previous-row demo' sub for previous_exercise_row scope", () => {
    const row: SchemaRow = {
      ...baseRowFields,
      rowKind: "STANDALONE_URL",
      rowPayload: {
        rowKind: "STANDALONE_URL",
        url: "https://example.com/clip.mp4",
        wrapped: false,
        appliesTo: "previous_exercise_row",
      },
    };

    const result = formatRow(row, exerciseById, 0);

    expect(result.subParts).toEqual(["previous-row demo"]);
  });
});

describe("STANDALONE_LOAD builder", () => {
  it("returns global load sub at index 0", () => {
    const result = buildStandaloneLoad(makeStandaloneLoadPayload(), exerciseById, 0);

    expect(result.subParts).toEqual(["global load"]);
    expect(result.mainText).toBe("20 kg");
    expect(result.kindBadge).toBe("LD");
  });

  it("returns applies-to-all-rows-above sub at index 2", () => {
    const result = buildStandaloneLoad(makeStandaloneLoadPayload(), exerciseById, 2);

    expect(result.subParts).toEqual(["applies to all rows above"]);
    expect(result.mainText).toBe("20 kg");
    expect(result.kindBadge).toBe("LD");
  });
});

describe("INNER_LADDER_MARKER builder", () => {
  it("appends colon suffix for multi-step ladder", () => {
    const result = buildInnerLadderMarker(makeInnerLadderMarkerPayload([12, 9, 6]));

    expect(result.mainText).toBe("12-9-6 :");
    expect(result.dashed).toBe(true);
  });

  it("omits colon suffix for single-step ladder", () => {
    const result = buildInnerLadderMarker(makeInnerLadderMarkerPayload([10]));

    expect(result.mainText).toBe("10");
    expect(result.dashed).toBe(true);
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
