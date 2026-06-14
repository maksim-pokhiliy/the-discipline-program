import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-row";

export const ID_BACK_SQUAT = "ckabc1234567890abcdef012345";
export const ID_DEADLIFT = "ckxyz1234567890abcdef012345";
export const ID_BENCH = "ckdef1234567890abcdef012345";
export const ID_PLACEHOLDER = "ckph01234567890abcdef01234";
export const ID_REST = "ckrest234567890abcdef01234";
export const ID_MISS = "ckmissing1234567890abcdef0";

export const DEMO_URL = "https://example.com/back-squat.mp4";

export const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
  id: overrides.id,
  canonicalName: overrides.canonicalName ?? "Back Squat",
  canonicalNameLower: overrides.canonicalNameLower ?? "back squat",
  nature: overrides.nature ?? "CONCRETE",
  movementFamily: overrides.movementFamily ?? "squat",
  defaultDemoUrls: overrides.defaultDemoUrls ?? [],
  aliases: overrides.aliases ?? [],
  equipment: overrides.equipment ?? [],
  notes: overrides.notes ?? null,
  createdAt: overrides.createdAt ?? new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: overrides.updatedAt ?? new Date("2025-01-01T00:00:00.000Z"),
});

export const exerciseById: ExerciseById = new Map([
  [
    ID_BACK_SQUAT,
    makeExercise({ id: ID_BACK_SQUAT, canonicalName: "Back Squat", defaultDemoUrls: [DEMO_URL] }),
  ],
  [ID_DEADLIFT, makeExercise({ id: ID_DEADLIFT, canonicalName: "Deadlift" })],
  [ID_BENCH, makeExercise({ id: ID_BENCH, canonicalName: "Bench Press" })],
  [
    ID_PLACEHOLDER,
    makeExercise({ id: ID_PLACEHOLDER, canonicalName: "Coach choice", nature: "PLACEHOLDER" }),
  ],
  [ID_REST, makeExercise({ id: ID_REST, canonicalName: "Rest", nature: "REST" })],
]);

export const baseRowFields: Omit<SchemaRow, "exerciseId"> = {
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
  modifiers: [],
  notes: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

export const makeExerciseRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  exerciseId: ID_BACK_SQUAT,
  ...overrides,
});

export const makePlaceholderRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  exerciseId: ID_PLACEHOLDER,
  ...overrides,
});

export const makeRestRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  exerciseId: ID_REST,
  ...overrides,
});
