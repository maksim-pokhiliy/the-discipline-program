import { type ExerciseEntry as PrismaExerciseEntry } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToExerciseEntry } from "./exercise-entry.mapper";

const validSnapshot = {
  id: "cls_exer_1",
  name: "Back Squat",
  primaryMovement: "SQUAT",
  modality: "BARBELL",
  primaryBodyParts: ["QUADS"],
  defaultMetrics: {
    canMeasureLoad: true,
    canMeasureReps: true,
    canMeasureDuration: false,
    canMeasureDistance: false,
    canMeasureCalories: false,
  },
  demoVideoUrl: null,
  demoImageUrl: null,
};

const makeRow = (overrides: Partial<PrismaExerciseEntry> = {}): PrismaExerciseEntry => ({
  id: "cls_entry_1",
  setGroupId: "cls_sg_1",
  order: 0,
  exerciseId: "cls_exer_1",
  exerciseSnapshot: validSnapshot,
  prescription: { reps: { kind: "FIXED", value: 5 } },
  alternatives: [],
  externalUrl: null,
  notes: null,
  version: 1,
  ...overrides,
});

describe("mapToExerciseEntry", () => {
  it("maps a happy-path entry", () => {
    const result = mapToExerciseEntry(makeRow());

    expect(result.id).toBe("cls_entry_1");
    expect(result.prescription.reps).toEqual({ kind: "FIXED", value: 5 });
    expect(result.alternatives).toEqual([]);
  });

  it("rejects an empty prescription (no reps/duration/distance/calories/composition)", () => {
    const row = makeRow({ prescription: {} });

    expect(() => mapToExerciseEntry(row)).toThrow();
  });

  it("rejects malformed exerciseSnapshot", () => {
    const row = makeRow({ exerciseSnapshot: { name: "missing required fields" } });

    expect(() => mapToExerciseEntry(row)).toThrow();
  });

  it("accepts prescription with composition only", () => {
    const row = makeRow({
      prescription: {
        composition: [{ exerciseId: "cls_exer_1", reps: 1 }],
      },
    });

    const result = mapToExerciseEntry(row);

    expect(result.prescription.composition).toHaveLength(1);
  });

  it("exposes version on output", () => {
    const result = mapToExerciseEntry(makeRow({ version: 4 }));

    expect(result.version).toBe(4);
  });
});
