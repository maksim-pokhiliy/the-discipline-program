import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatRow } from "./format-row";
import {
  ID_BACK_SQUAT,
  ID_DEADLIFT,
  ID_MISS,
  baseRowFields,
  exerciseById,
  makeExerciseRow,
  makeFootnoteRow,
} from "./format-row.fixtures";

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
