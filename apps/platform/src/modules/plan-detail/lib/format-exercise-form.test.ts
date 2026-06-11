import { describe, expect, it } from "vitest";

import type { ExerciseForm } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import { formatExerciseForm } from "./format-exercise-form";
import { type ExerciseById } from "./format-percentage-reference";

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

const ID_A = "ckabc1234567890abcdef012345";
const ID_B = "ckxyz1234567890abcdef012345";
const ID_C = "ckdef1234567890abcdef012345";
const ID_MISS = "ckmissing1234567890abcdef0";

const exerciseById: ExerciseById = new Map([
  [ID_A, makeExercise({ id: ID_A, canonicalName: "Back Squat" })],
  [ID_B, makeExercise({ id: ID_B, canonicalName: "Deadlift" })],
  [ID_C, makeExercise({ id: ID_C, canonicalName: "Bench Press" })],
]);

describe("formatExerciseForm", () => {
  describe("atomic form", () => {
    it("returns the resolved canonicalName with empty sub", () => {
      const form: ExerciseForm = { form: "atomic", exerciseId: ID_A };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "Back Squat",
        sub: [],
      });
    });

    it("falls back to '—' when the exercise lookup misses", () => {
      const form: ExerciseForm = { form: "atomic", exerciseId: ID_MISS };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "—",
        sub: [],
      });
    });

    it("returns placeholder shape when atomic exerciseId points to placeholderFlag exercise", () => {
      const ID_PLACEHOLDER_ATOMIC = "ckplaceh1234567890abcdef01";
      const placeholderExerciseById: ExerciseById = new Map([
        ...exerciseById,
        [
          ID_PLACEHOLDER_ATOMIC,
          makeExercise({
            id: ID_PLACEHOLDER_ATOMIC,
            canonicalName: "Any squat",
            canonicalCompoundType: "PLACEHOLDER",
            placeholderFlag: true,
          }),
        ],
      ]);
      const form: ExerciseForm = { form: "atomic", exerciseId: ID_PLACEHOLDER_ATOMIC };

      expect(formatExerciseForm(form, placeholderExerciseById)).toEqual({
        name: "Any squat",
        sub: ["placeholder"],
      });
    });
  });

  describe("compound form", () => {
    it("joins elements with ' + ' using '<name> × <reps>' per element", () => {
      const form: ExerciseForm = {
        form: "compound",
        compound: {
          elements: [
            { exerciseId: ID_A, reps: { kind: "count", value: 5 } },
            { exerciseId: ID_B, reps: { kind: "count", value: 3 } },
          ],
        },
      };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "Back Squat × 5 reps + Deadlift × 3 reps",
        sub: ["compound row"],
      });
    });

    it("uses '—' fallback for missing exercises within the compound", () => {
      const form: ExerciseForm = {
        form: "compound",
        compound: {
          elements: [
            { exerciseId: ID_MISS, reps: { kind: "count", value: 5 } },
            { exerciseId: ID_A, reps: { kind: "count", value: 3 } },
          ],
        },
      };

      expect(formatExerciseForm(form, exerciseById).name).toBe("— × 5 reps + Back Squat × 3 reps");
    });
  });

  describe("or_alternative form", () => {
    it("renders 'primary · or · alternative' with purpose underscore-replaced", () => {
      const form: ExerciseForm = {
        form: "or_alternative",
        orAlternative: {
          primaryExerciseId: ID_A,
          primaryReps: { kind: "count", value: 5 },
          alternativeExerciseId: ID_B,
          alternativeReps: { kind: "count", value: 5 },
          purpose: "scale_down",
        },
      };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "Back Squat · or · Deadlift",
        sub: ["scale down"],
      });
    });

    it("uses '—' fallback when an exercise is missing", () => {
      const form: ExerciseForm = {
        form: "or_alternative",
        orAlternative: {
          primaryExerciseId: ID_MISS,
          primaryReps: { kind: "count", value: 5 },
          alternativeExerciseId: ID_A,
          alternativeReps: { kind: "count", value: 5 },
          purpose: "equipment_substitute",
        },
      };

      expect(formatExerciseForm(form, exerciseById).name).toBe("— · or · Back Squat");
    });
  });

  describe("placeholder_ref form", () => {
    it("renders the resolved canonical name with 'placeholder' sub", () => {
      const form: ExerciseForm = {
        form: "placeholder_ref",
        placeholderExerciseId: ID_A,
      };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "Back Squat",
        sub: ["placeholder"],
      });
    });

    it("falls back to '(placeholder)' when the placeholder exercise lookup misses", () => {
      const form: ExerciseForm = {
        form: "placeholder_ref",
        placeholderExerciseId: ID_MISS,
      };

      expect(formatExerciseForm(form, exerciseById)).toEqual({
        name: "(placeholder)",
        sub: ["placeholder"],
      });
    });
  });
});
