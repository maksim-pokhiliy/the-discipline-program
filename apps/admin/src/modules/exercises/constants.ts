import {
  type ExerciseCanonicalCompoundType,
  type ExerciseEquipment,
  type ExerciseMovementType,
} from "@repo/contracts/lms/exercise";

export const EQUIPMENT_LABELS: Record<ExerciseEquipment, string> = {
  ASSAULT_BIKE: "Assault Bike",
  ATLAS_STONE: "Atlas Stone",
  BAND: "Band",
  BARBELL: "Barbell",
  BODYWEIGHT: "Bodyweight",
  BOX: "Box",
  BOX_OR_SOFA: "Box / Sofa",
  DUMBBELL: "Dumbbell",
  JUMP_ROPE: "Jump Rope",
  KETTLEBELL: "Kettlebell",
  MIXED: "Mixed",
  PARALLEL_BARS: "Parallel Bars",
  RINGS: "Rings",
  ROW_ERG: "Row Erg",
  SKI_ERG: "Ski Erg",
  SLED: "Sled",
  SOFA: "Sofa",
  UNKNOWN: "Unknown",
  YOKE: "Yoke",
};

export const MOVEMENT_TYPE_LABELS: Record<ExerciseMovementType, string> = {
  SQUAT: "Squat",
  HINGE: "Hinge",
  PRESS: "Press",
  PULL: "Pull",
  LUNGE: "Lunge",
  CARRY: "Carry",
  LOCOMOTION: "Locomotion",
  STATIC_HOLD: "Static Hold",
  ROTATIONAL: "Rotational",
  CARDIO_FLOW: "Cardio Flow",
  CORE: "Core",
  COMBINED_OLYMPIC: "Combined Olympic",
  RAISE: "Raise",
  EXTENSION: "Extension",
  UNKNOWN: "Unknown",
};

export const COMPOUND_TYPE_LABELS: Record<ExerciseCanonicalCompoundType, string> = {
  ATOMIC: "Atomic",
  COMPOUND_PLUS: "Compound Plus",
  COMPOSITE_NAMED: "Composite Named",
  PLACEHOLDER: "Placeholder",
  ALTERNATIVE_OR: "Alternative (OR)",
};
