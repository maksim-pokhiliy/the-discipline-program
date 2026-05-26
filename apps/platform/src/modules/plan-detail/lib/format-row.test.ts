import { describe, expect, it } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById, formatRow } from "./format-row";

const ID_BACK_SQUAT = "ckabc1234567890abcdef012345";
const ID_DEADLIFT = "ckxyz1234567890abcdef012345";
const ID_BENCH = "ckdef1234567890abcdef012345";
const ID_MISS = "ckmissing1234567890abcdef0";

const DEMO_URL = "https://example.com/back-squat.mp4";

const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
  id: overrides.id,
  canonicalName: overrides.canonicalName ?? "Back Squat",
  canonicalNameLower: overrides.canonicalNameLower ?? "back squat",
  primaryEquipment: overrides.primaryEquipment ?? "BARBELL",
  movementTypeTagPrimary: overrides.movementTypeTagPrimary ?? "SQUAT",
  movementTypeTagSecondary: overrides.movementTypeTagSecondary ?? null,
  canonicalCompoundType: overrides.canonicalCompoundType ?? "ATOMIC",
  placeholderFlag: overrides.placeholderFlag ?? false,
  movementFamily: overrides.movementFamily ?? "squat",
  defaultDemoUrls: overrides.defaultDemoUrls ?? [],
  aliases: overrides.aliases ?? [],
  notes: overrides.notes ?? null,
  createdAt: overrides.createdAt ?? new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: overrides.updatedAt ?? new Date("2025-01-01T00:00:00.000Z"),
});

const exerciseById: ExerciseById = new Map([
  [
    ID_BACK_SQUAT,
    makeExercise({ id: ID_BACK_SQUAT, canonicalName: "Back Squat", defaultDemoUrls: [DEMO_URL] }),
  ],
  [ID_DEADLIFT, makeExercise({ id: ID_DEADLIFT, canonicalName: "Deadlift" })],
  [ID_BENCH, makeExercise({ id: ID_BENCH, canonicalName: "Bench Press" })],
]);

const baseRowFields = {
  id: "ckrow1234567890abcdef012345",
  schemaId: "cksch1234567890abcdef012345",
  order: 1,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
} as const;

const makeExerciseRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_BACK_SQUAT } },
  ...overrides,
});

describe("formatRow", () => {
  describe("EXERCISE row kind", () => {
    it("renders the canonical name for atomic exercise as mainText", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.mainText).toBe("Back Squat");
      expect(result.kindBadge).toBe("EX");
      expect(result.kindCls).toBe("ex");
      expect(result.dashed).toBe(false);
      expect(result.ord).toBe("1");
    });

    it("returns null formPillText for atomic form", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.formPillText).toBeNull();
    });

    it("returns the first demo url for atomic form when present", () => {
      const result = formatRow(makeExerciseRow(), exerciseById, 0);

      expect(result.demoUrl).toBe(DEMO_URL);
    });

    it("returns null demoUrl when defaultDemoUrls is empty", () => {
      const row = makeExerciseRow({
        rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_DEADLIFT } },
      });
      const result = formatRow(row, exerciseById, 0);

      expect(result.demoUrl).toBeNull();
    });

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

  describe("REST row kind", () => {
    it("renders formatted rest spec as mainText", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REST",
        rowPayload: {
          rowKind: "REST",
          raw: "rest 90s",
          parsed: {
            duration: { value: 90, unit: "sec" },
            scope: "between_sets",
          },
        },
      };

      const result = formatRow(row, exerciseById, 2);

      expect(result.mainText).toBe("rest 90s between sets");
      expect(result.kindBadge).toBe("RST");
      expect(result.kindCls).toBe("rest");
      expect(result.ord).toBe("3");
      expect(result.subParts).toEqual([]);
    });
  });

  describe("FOOTNOTE row kind", () => {
    it("renders marker + elements + target", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "FOOTNOTE",
        rowPayload: {
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_round",
          content: {
            elements: [{ exerciseId: ID_BACK_SQUAT, reps: { kind: "count", value: 5 } }],
          },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("* Back Squat × 5 reps (each round)");
      expect(result.kindBadge).toBe("FN");
      expect(result.kindCls).toBe("foot");
      expect(result.ord).toBe("*");
    });

    it("falls back to row notes when content has no elements", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "FOOTNOTE",
        notes: "as feels",
        rowPayload: {
          rowKind: "FOOTNOTE",
          marker: "**",
          target: "each_set",
          content: { elements: [] },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("** as feels (each set)");
      expect(result.ord).toBe("**");
    });

    it("does NOT append notes to subParts for FOOTNOTE kind", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "FOOTNOTE",
        notes: "important",
        rowPayload: {
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_round",
          content: { elements: [] },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });
  });

  describe("STANDALONE_LOAD row kind", () => {
    it("renders formatted load mainText with 'applies to all rows above' sub", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "STANDALONE_LOAD",
        rowPayload: {
          rowKind: "STANDALONE_LOAD",
          load: { kind: "absolute", weight: { variant: "single", valueKg: 20 } },
          scope: "applies_to_all_preceding_rows",
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("20 kg");
      expect(result.subParts).toEqual(["applies to all rows above"]);
      expect(result.kindBadge).toBe("LD");
      expect(result.kindCls).toBe("load");
      expect(result.ord).toBe("L");
    });
  });

  describe("STANDALONE_URL row kind", () => {
    it("renders the url and 'schema reference' sub for whole_schema scope", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "STANDALONE_URL",
        rowPayload: {
          rowKind: "STANDALONE_URL",
          url: "https://example.com/ref.pdf",
          wrapped: false,
          appliesTo: "whole_schema",
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("https://example.com/ref.pdf");
      expect(result.subParts).toEqual(["schema reference"]);
      expect(result.kindBadge).toBe("URL");
      expect(result.kindCls).toBe("url");
      expect(result.ord).toBe("U");
    });

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

  describe("PLACEHOLDER row kind", () => {
    it("renders placeholder text + 'placeholder · <kind>' sub with dashed=true and ord='?'", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "PLACEHOLDER",
        rowPayload: {
          rowKind: "PLACEHOLDER",
          placeholder: {
            placeholderKind: "coach_choice_slot",
            text: "ABS finisher",
          },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("ABS finisher");
      expect(result.subParts).toEqual(["placeholder · coach choice slot"]);
      expect(result.kindBadge).toBe("?");
      expect(result.kindCls).toBe("placeholder");
      expect(result.dashed).toBe(true);
      expect(result.ord).toBe("?");
    });
  });

  describe("INNER_LADDER_MARKER row kind", () => {
    it("renders steps joined by '-' suffix ' :', dashed=true, ord='—'", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "INNER_LADDER_MARKER",
        rowPayload: { rowKind: "INNER_LADDER_MARKER", steps: [12, 9, 6] },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("12-9-6 :");
      expect(result.subParts).toEqual(["ladder marker — segments rows below"]);
      expect(result.kindBadge).toBe("↓");
      expect(result.kindCls).toBe("ladder");
      expect(result.dashed).toBe(true);
      expect(result.ord).toBe("—");
    });
  });

  describe("REP_DEFINITION row kind", () => {
    it("renders '<total> reps = <count>× <name> + ...' with ord='≡'", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REP_DEFINITION",
        rowPayload: {
          rowKind: "REP_DEFINITION",
          equality: {
            form: "inline_equality",
            totalReps: 5,
            composition: [
              { exerciseId: ID_BACK_SQUAT, count: 1 },
              { exerciseId: ID_DEADLIFT, count: 2 },
            ],
          },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("5 reps = 1× Back Squat + 2× Deadlift");
      expect(result.subParts).toEqual(["rep definition"]);
      expect(result.kindBadge).toBe("≡");
      expect(result.kindCls).toBe("ex");
      expect(result.ord).toBe("≡");
    });
  });

  describe("REST_SLOT row kind", () => {
    it("renders the static 'Rest slot' main and 'EMOM minute · rest' sub with ord='R'", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("Rest slot");
      expect(result.subParts).toEqual(["EMOM minute · rest"]);
      expect(result.kindBadge).toBe("RS");
      expect(result.kindCls).toBe("rest");
      expect(result.ord).toBe("R");
    });
  });

  describe("notes append", () => {
    it("appends quoted notes to subParts for non-FOOTNOTE rows", () => {
      const row = makeExerciseRow({ notes: "explosive" });
      const result = formatRow(row, exerciseById, 0);

      expect(result.subParts).toContain("'explosive'");
    });

    it("does NOT append notes when notes is null", () => {
      const row = makeExerciseRow({ notes: null });
      const result = formatRow(row, exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });

    it("does NOT append notes when notes is empty string", () => {
      const row = makeExerciseRow({ notes: "" });
      const result = formatRow(row, exerciseById, 0);

      expect(result.subParts).toEqual([]);
    });
  });

  describe("exerciseById miss fallback", () => {
    it("falls back to '—' for missing atomic exercise in EXERCISE row", () => {
      const row = makeExerciseRow({
        rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_MISS } },
      });
      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("—");
    });

    it("falls back to '?' for missing exercise in REP_DEFINITION composition", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REP_DEFINITION",
        rowPayload: {
          rowKind: "REP_DEFINITION",
          equality: {
            form: "inline_equality",
            totalReps: 3,
            composition: [{ exerciseId: ID_MISS, count: 1 }],
          },
        },
      };

      const result = formatRow(row, exerciseById, 0);

      expect(result.mainText).toBe("3 reps = 1× ?");
    });
  });

  describe("per-RowKind ord values", () => {
    it("uses 1-based index for EXERCISE", () => {
      expect(formatRow(makeExerciseRow(), exerciseById, 0).ord).toBe("1");
      expect(formatRow(makeExerciseRow(), exerciseById, 4).ord).toBe("5");
    });

    it("uses 1-based index for REST", () => {
      const row: SchemaRow = {
        ...baseRowFields,
        rowKind: "REST",
        rowPayload: {
          rowKind: "REST",
          raw: "rest",
          parsed: { duration: { value: 1, unit: "min" }, scope: "between_sets" },
        },
      };

      expect(formatRow(row, exerciseById, 1).ord).toBe("2");
    });
  });
});
