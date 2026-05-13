export const EXERCISE_CONSTANTS = {
  MAX_CANONICAL_NAME_LENGTH: 200,
  MAX_MOVEMENT_FAMILY_LENGTH: 100,
} as const;

export const EXERCISE_EQUIPMENT = [
  "ASSAULT_BIKE",
  "ATLAS_STONE",
  "BAND",
  "BARBELL",
  "BODYWEIGHT",
  "BOX",
  "BOX_OR_SOFA",
  "DUMBBELL",
  "JUMP_ROPE",
  "KETTLEBELL",
  "MIXED",
  "PARALLEL_BARS",
  "RINGS",
  "ROW_ERG",
  "SKI_ERG",
  "SLED",
  "SOFA",
  "UNKNOWN",
  "YOKE",
] as const;
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT)[number];

export const EXERCISE_MOVEMENT_TYPE = [
  "SQUAT",
  "HINGE",
  "PRESS",
  "PULL",
  "LUNGE",
  "CARRY",
  "LOCOMOTION",
  "STATIC_HOLD",
  "ROTATIONAL",
  "CARDIO_FLOW",
  "CORE",
  "COMBINED_OLYMPIC",
  "RAISE",
  "EXTENSION",
  "UNKNOWN",
] as const;
export type ExerciseMovementType = (typeof EXERCISE_MOVEMENT_TYPE)[number];

export const EXERCISE_CANONICAL_COMPOUND_TYPE = [
  "ATOMIC",
  "COMPOUND_PLUS",
  "COMPOSITE_NAMED",
  "PLACEHOLDER",
  "ALTERNATIVE_OR",
] as const;
export type ExerciseCanonicalCompoundType = (typeof EXERCISE_CANONICAL_COMPOUND_TYPE)[number];
