import { describe, expect, it } from "vitest";

import type { Load } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import { formatLoad } from "./format-load";
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

const EMPTY_MAP: ExerciseById = new Map();

describe("formatLoad", () => {
  describe("absolute kind", () => {
    it("delegates to formatWeight for single variant", () => {
      const load: Load = {
        kind: "absolute",
        weight: { variant: "single", valueKg: 15 },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("15 kg");
    });

    it("delegates to formatWeight for compound_device variant", () => {
      const load: Load = {
        kind: "absolute",
        weight: { variant: "compound_device", equipment: "KETTLEBELL", count: 2, valueKg: 16 },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("2 × 16 kg kettlebell");
    });
  });

  describe("percentage kind", () => {
    it("renders '<value>% of 1RM' for self scope, no range", () => {
      const load: Load = {
        kind: "percentage",
        value: 75,
        reference: { scope: "self" },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("75% of 1RM");
    });

    it("renders '<min>–<max>% of 1RM' for self scope with rangeMax", () => {
      const load: Load = {
        kind: "percentage",
        value: 60,
        rangeMax: 70,
        reference: { scope: "self" },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("60–70% of 1RM");
    });

    it("renders '<value>% of <family> 1RM' for movement_family scope", () => {
      const load: Load = {
        kind: "percentage",
        value: 80,
        reference: { scope: "movement_family", movementFamily: "deadlift" },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("80% of deadlift 1RM");
    });

    it("renders '<value>% of <canonicalName> 1RM' for resolved other_exercise scope", () => {
      const exerciseId = "ckabc1234567890abcdef012345";
      const exerciseById: ExerciseById = new Map([
        [exerciseId, makeExercise({ id: exerciseId, canonicalName: "Front Squat" })],
      ]);
      const load: Load = {
        kind: "percentage",
        value: 65,
        reference: { scope: "other_exercise", targetExerciseId: exerciseId },
      };

      expect(formatLoad(load, exerciseById)).toBe("65% of Front Squat 1RM");
    });

    it("falls back to '—' for other_exercise lookup miss", () => {
      const load: Load = {
        kind: "percentage",
        value: 50,
        reference: {
          scope: "other_exercise",
          targetExerciseId: "ckmissing1234567890abcdef0",
        },
      };

      expect(formatLoad(load, EMPTY_MAP)).toBe("50% of — 1RM");
    });
  });

  describe("bodyweight kind", () => {
    it("renders 'BW'", () => {
      const load: Load = { kind: "bodyweight" };

      expect(formatLoad(load, EMPTY_MAP)).toBe("BW");
    });
  });

  describe("byProfile kind", () => {
    it("renders '<first> / <second> (M/F)'", () => {
      const load: Load = { kind: "byProfile", first: 24, second: 16 };

      expect(formatLoad(load, EMPTY_MAP)).toBe("24 / 16 (M/F)");
    });
  });

  describe("none kind", () => {
    it("renders 'no load'", () => {
      const load: Load = { kind: "none" };

      expect(formatLoad(load, EMPTY_MAP)).toBe("no load");
    });
  });
});
