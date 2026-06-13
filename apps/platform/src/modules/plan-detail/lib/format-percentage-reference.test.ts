import { describe, expect, it } from "vitest";

import type { PercentageReference } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import { type ExerciseById, formatPercentageReference } from "./format-percentage-reference";

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

const EMPTY_MAP: ExerciseById = new Map();

describe("formatPercentageReference", () => {
  it("renders 'of 1RM' for self scope", () => {
    const ref: PercentageReference = { scope: "self" };

    expect(formatPercentageReference(ref, EMPTY_MAP)).toBe("of 1RM");
  });

  it("renders 'of <canonicalName> 1RM' when other_exercise is resolved", () => {
    const exerciseId = "ckabc1234567890abcdef012345";
    const exerciseById: ExerciseById = new Map([
      [exerciseId, makeExercise({ id: exerciseId, canonicalName: "Deadlift" })],
    ]);
    const ref: PercentageReference = {
      scope: "other_exercise",
      targetExerciseId: exerciseId,
    };

    expect(formatPercentageReference(ref, exerciseById)).toBe("of Deadlift 1RM");
  });

  it("falls back to '—' when other_exercise lookup misses", () => {
    const ref: PercentageReference = {
      scope: "other_exercise",
      targetExerciseId: "ckmissing1234567890abcdef0",
    };

    expect(formatPercentageReference(ref, EMPTY_MAP)).toBe("of — 1RM");
  });
});
