import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-row";

export const ID_BACK_SQUAT = "ckabc1234567890abcdef012345";
export const ID_DEADLIFT = "ckxyz1234567890abcdef012345";
export const ID_BENCH = "ckdef1234567890abcdef012345";
export const ID_MISS = "ckmissing1234567890abcdef0";

export const DEMO_URL = "https://example.com/back-squat.mp4";

export const makeExercise = (overrides: Partial<Exercise> & Pick<Exercise, "id">): Exercise => ({
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

export const exerciseById: ExerciseById = new Map([
  [
    ID_BACK_SQUAT,
    makeExercise({ id: ID_BACK_SQUAT, canonicalName: "Back Squat", defaultDemoUrls: [DEMO_URL] }),
  ],
  [ID_DEADLIFT, makeExercise({ id: ID_DEADLIFT, canonicalName: "Deadlift" })],
  [ID_BENCH, makeExercise({ id: ID_BENCH, canonicalName: "Bench Press" })],
]);

export const baseRowFields = {
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
  notes: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
} as const;

export const makeExerciseRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  ...baseRowFields,
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: ID_BACK_SQUAT } },
  ...overrides,
});

export const makeRestRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "REST",
  rowPayload: {
    rowKind: "REST",
    raw: "rest 90s",
    parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
  },
});

export const makePlaceholderRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "PLACEHOLDER",
  rowPayload: {
    rowKind: "PLACEHOLDER",
    placeholder: { placeholderKind: "coach_choice_slot", text: "ABS finisher" },
  },
});

export const makeRestSlotRow = (): SchemaRow => ({
  ...baseRowFields,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
});
