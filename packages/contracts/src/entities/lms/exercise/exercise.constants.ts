export const EXERCISE_CONSTANTS = {
  MAX_CANONICAL_NAME_LENGTH: 200,
  MAX_URL_LENGTH: 2048,
  MAX_NOTES_LENGTH: 10_000,
  MAX_ARRAY_LENGTH: 20,
} as const;

export const EXERCISE_NATURE = ["CONCRETE", "PLACEHOLDER", "REST"] as const;
export type ExerciseNature = (typeof EXERCISE_NATURE)[number];
