import {
  CanonicalCompoundType as PrismaCanonicalCompoundType,
  Equipment as PrismaEquipment,
  MovementType as PrismaMovementType,
} from "@prisma/client";

import {
  type ExerciseCanonicalCompoundType,
  type ExerciseEquipment,
  type ExerciseMovementType,
} from "@repo/contracts/lms/exercise";

export const EQUIPMENT_MAP: Record<PrismaEquipment, ExerciseEquipment> = {
  ASSAULT_BIKE: "ASSAULT_BIKE",
  ATLAS_STONE: "ATLAS_STONE",
  BAND: "BAND",
  BARBELL: "BARBELL",
  BODYWEIGHT: "BODYWEIGHT",
  BOX: "BOX",
  BOX_OR_SOFA: "BOX_OR_SOFA",
  DUMBBELL: "DUMBBELL",
  JUMP_ROPE: "JUMP_ROPE",
  KETTLEBELL: "KETTLEBELL",
  MIXED: "MIXED",
  PARALLEL_BARS: "PARALLEL_BARS",
  RINGS: "RINGS",
  ROW_ERG: "ROW_ERG",
  SKI_ERG: "SKI_ERG",
  SLED: "SLED",
  SOFA: "SOFA",
  UNKNOWN: "UNKNOWN",
  YOKE: "YOKE",
};

export const equipmentToPrisma: Record<ExerciseEquipment, PrismaEquipment> = {
  ASSAULT_BIKE: PrismaEquipment.ASSAULT_BIKE,
  ATLAS_STONE: PrismaEquipment.ATLAS_STONE,
  BAND: PrismaEquipment.BAND,
  BARBELL: PrismaEquipment.BARBELL,
  BODYWEIGHT: PrismaEquipment.BODYWEIGHT,
  BOX: PrismaEquipment.BOX,
  BOX_OR_SOFA: PrismaEquipment.BOX_OR_SOFA,
  DUMBBELL: PrismaEquipment.DUMBBELL,
  JUMP_ROPE: PrismaEquipment.JUMP_ROPE,
  KETTLEBELL: PrismaEquipment.KETTLEBELL,
  MIXED: PrismaEquipment.MIXED,
  PARALLEL_BARS: PrismaEquipment.PARALLEL_BARS,
  RINGS: PrismaEquipment.RINGS,
  ROW_ERG: PrismaEquipment.ROW_ERG,
  SKI_ERG: PrismaEquipment.SKI_ERG,
  SLED: PrismaEquipment.SLED,
  SOFA: PrismaEquipment.SOFA,
  UNKNOWN: PrismaEquipment.UNKNOWN,
  YOKE: PrismaEquipment.YOKE,
};

export const MOVEMENT_TYPE_MAP: Record<PrismaMovementType, ExerciseMovementType> = {
  SQUAT: "SQUAT",
  HINGE: "HINGE",
  PRESS: "PRESS",
  PULL: "PULL",
  LUNGE: "LUNGE",
  CARRY: "CARRY",
  LOCOMOTION: "LOCOMOTION",
  STATIC_HOLD: "STATIC_HOLD",
  ROTATIONAL: "ROTATIONAL",
  CARDIO_FLOW: "CARDIO_FLOW",
  CORE: "CORE",
  COMBINED_OLYMPIC: "COMBINED_OLYMPIC",
  RAISE: "RAISE",
  EXTENSION: "EXTENSION",
  UNKNOWN: "UNKNOWN",
};

export const movementTypeToPrisma: Record<ExerciseMovementType, PrismaMovementType> = {
  SQUAT: PrismaMovementType.SQUAT,
  HINGE: PrismaMovementType.HINGE,
  PRESS: PrismaMovementType.PRESS,
  PULL: PrismaMovementType.PULL,
  LUNGE: PrismaMovementType.LUNGE,
  CARRY: PrismaMovementType.CARRY,
  LOCOMOTION: PrismaMovementType.LOCOMOTION,
  STATIC_HOLD: PrismaMovementType.STATIC_HOLD,
  ROTATIONAL: PrismaMovementType.ROTATIONAL,
  CARDIO_FLOW: PrismaMovementType.CARDIO_FLOW,
  CORE: PrismaMovementType.CORE,
  COMBINED_OLYMPIC: PrismaMovementType.COMBINED_OLYMPIC,
  RAISE: PrismaMovementType.RAISE,
  EXTENSION: PrismaMovementType.EXTENSION,
  UNKNOWN: PrismaMovementType.UNKNOWN,
};

export const CANONICAL_COMPOUND_TYPE_MAP: Record<
  PrismaCanonicalCompoundType,
  ExerciseCanonicalCompoundType
> = {
  ATOMIC: "ATOMIC",
  COMPOUND_PLUS: "COMPOUND_PLUS",
  COMPOSITE_NAMED: "COMPOSITE_NAMED",
  PLACEHOLDER: "PLACEHOLDER",
  ALTERNATIVE_OR: "ALTERNATIVE_OR",
};

export const canonicalCompoundTypeToPrisma: Record<
  ExerciseCanonicalCompoundType,
  PrismaCanonicalCompoundType
> = {
  ATOMIC: PrismaCanonicalCompoundType.ATOMIC,
  COMPOUND_PLUS: PrismaCanonicalCompoundType.COMPOUND_PLUS,
  COMPOSITE_NAMED: PrismaCanonicalCompoundType.COMPOSITE_NAMED,
  PLACEHOLDER: PrismaCanonicalCompoundType.PLACEHOLDER,
  ALTERNATIVE_OR: PrismaCanonicalCompoundType.ALTERNATIVE_OR,
};
