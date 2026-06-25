import { describe, expect, it } from "vitest";

import { type Exercise } from "../exercise";
import { type SchemaRow } from "../schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import { type RowIntensityContext, buildRowSummaryTexts, renderRowLine } from "./render-row-line";

const ID_BACK_SQUAT = "ckabc1234567890abcdef012345";
const ID_MISS = "ckmissing1234567890abcdef0";

const EMPTY_CONTEXT: RowIntensityContext = { blockIntensity: null, schemaIntensity: null };

const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
  id: overrides.id,
  canonicalName: overrides.canonicalName ?? "Back Squat",
  canonicalNameLower: overrides.canonicalNameLower ?? "back squat",
  nature: overrides.nature ?? "CONCRETE",
  defaultDemoUrls: overrides.defaultDemoUrls ?? [],
  aliases: overrides.aliases ?? [],
  notes: overrides.notes ?? null,
  createdAt: overrides.createdAt ?? new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: overrides.updatedAt ?? new Date("2025-01-01T00:00:00.000Z"),
});

const exerciseById: ExerciseById = new Map([
  [ID_BACK_SQUAT, makeExercise({ id: ID_BACK_SQUAT, canonicalName: "Back Squat" })],
]);

const baseRow: Omit<SchemaRow, "exerciseId"> = {
  id: "ckrow1234567890abcdef012345",
  schemaId: "cksch1234567890abcdef012345",
  order: 1,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  intensity: null,
  rest: null,
  modifiers: [],
  notes: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRow,
  exerciseId: ID_BACK_SQUAT,
  ...overrides,
});

describe("renderRowLine", () => {
  it("renders the canonical exercise name alone when the row has no prescription", () => {
    expect(renderRowLine(makeRow(), exerciseById, EMPTY_CONTEXT)).toBe("Back Squat");
  });

  it("falls back to the exercise placeholder when the lookup misses", () => {
    expect(renderRowLine(makeRow({ exerciseId: ID_MISS }), exerciseById, EMPTY_CONTEXT)).toBe(
      "exercise",
    );
  });

  it("joins every summary field in the display order with single spaces", () => {
    const row = makeRow({
      sets: 4,
      reps: { kind: "count", value: 5 },
      load: { kind: "percentage", value: 75, reference: { scope: "self" } },
      side: { kind: "each_leg" },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
      intensity: { rpe: { value: 8 } },
      rest: { duration: { value: 120, unit: "sec" }, scope: "between_sets" },
      modifiers: [
        {
          id: "ckmod01234567890abcdef0123",
          name: "from sofa",
          nameLower: "from sofa",
          notes: null,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      ],
      notes: ["keep the chest up"],
    });

    expect(renderRowLine(row, exerciseById, EMPTY_CONTEXT)).toBe(
      "Back Squat 4 × 5 reps @75% of 1RM each leg 3-1-1-0 RPE 8 rest 120s between sets from sofa keep the chest up",
    );
  });

  it("prepends an inherited block intensity chip before an own row chip", () => {
    const row = makeRow({ intensity: { rpe: { value: 8 } } });
    const line = renderRowLine(row, exerciseById, {
      blockIntensity: { effortPercent: { value: 85 } },
      schemaIntensity: null,
    });

    expect(line).toBe("Back Squat EFFORT 85% RPE 8");
  });

  it("renders a bodyweight load as BW", () => {
    const row = makeRow({ load: { kind: "bodyweight" } });

    expect(renderRowLine(row, exerciseById, EMPTY_CONTEXT)).toBe("Back Squat BW");
  });

  it("joins multiple notes with the display dot separator", () => {
    const row = makeRow({ notes: ["tempo strict", "belt optional"] });

    expect(renderRowLine(row, exerciseById, EMPTY_CONTEXT)).toBe(
      "Back Squat tempo strict · belt optional",
    );
  });
});

describe("buildRowSummaryTexts", () => {
  it("exposes the structured texts the platform summary consumes", () => {
    const row = makeRow({
      sets: 4,
      reps: { kind: "count", value: 5 },
      load: { kind: "bodyweight" },
      side: { kind: "each_leg" },
      tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
    });

    expect(buildRowSummaryTexts(row, exerciseById, EMPTY_CONTEXT)).toEqual({
      volume: "4 × 5 reps",
      load: "BW",
      side: "each leg",
      tempo: "3-1-1-0",
      intensityTexts: [],
      rest: null,
      modifiers: [],
      notes: [],
    });
  });

  it("returns the row notes verbatim so the projection can join them", () => {
    const row = makeRow({ notes: ["a", "b"] });

    expect(buildRowSummaryTexts(row, exerciseById, EMPTY_CONTEXT).notes).toEqual(["a", "b"]);
  });
});
