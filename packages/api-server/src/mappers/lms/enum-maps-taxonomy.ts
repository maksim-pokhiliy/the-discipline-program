import {
  BodyPart as PrismaBodyPart,
  Modality as PrismaModality,
  MovementPattern as PrismaMovementPattern,
  PrKind as PrismaPrKind,
  SkillLevel as PrismaSkillLevel,
} from "@prisma/client";

import {
  type BodyPart,
  type Modality,
  type MovementPattern,
  type PrKind,
  type SkillLevel,
} from "@repo/contracts/lms/_domain";

export const MOVEMENT_PATTERN_MAP: Record<PrismaMovementPattern, MovementPattern> = {
  SQUAT: "SQUAT",
  HINGE: "HINGE",
  PUSH_VERTICAL: "PUSH_VERTICAL",
  PUSH_HORIZONTAL: "PUSH_HORIZONTAL",
  PULL_VERTICAL: "PULL_VERTICAL",
  PULL_HORIZONTAL: "PULL_HORIZONTAL",
  LUNGE: "LUNGE",
  CARRY: "CARRY",
  ROTATION: "ROTATION",
  CORE_FLEXION: "CORE_FLEXION",
  CORE_EXTENSION: "CORE_EXTENSION",
  CORE_ANTI: "CORE_ANTI",
  CARDIO_RUN: "CARDIO_RUN",
  CARDIO_BIKE: "CARDIO_BIKE",
  CARDIO_ROW: "CARDIO_ROW",
  CARDIO_OTHER: "CARDIO_OTHER",
  GYMNASTIC_HOLD: "GYMNASTIC_HOLD",
  GYMNASTIC_INVERTED: "GYMNASTIC_INVERTED",
  EXPLOSIVE: "EXPLOSIVE",
  COMBO: "COMBO",
};

export const MOVEMENT_PATTERN_TO_PRISMA_MAP: Record<MovementPattern, PrismaMovementPattern> = {
  SQUAT: PrismaMovementPattern.SQUAT,
  HINGE: PrismaMovementPattern.HINGE,
  PUSH_VERTICAL: PrismaMovementPattern.PUSH_VERTICAL,
  PUSH_HORIZONTAL: PrismaMovementPattern.PUSH_HORIZONTAL,
  PULL_VERTICAL: PrismaMovementPattern.PULL_VERTICAL,
  PULL_HORIZONTAL: PrismaMovementPattern.PULL_HORIZONTAL,
  LUNGE: PrismaMovementPattern.LUNGE,
  CARRY: PrismaMovementPattern.CARRY,
  ROTATION: PrismaMovementPattern.ROTATION,
  CORE_FLEXION: PrismaMovementPattern.CORE_FLEXION,
  CORE_EXTENSION: PrismaMovementPattern.CORE_EXTENSION,
  CORE_ANTI: PrismaMovementPattern.CORE_ANTI,
  CARDIO_RUN: PrismaMovementPattern.CARDIO_RUN,
  CARDIO_BIKE: PrismaMovementPattern.CARDIO_BIKE,
  CARDIO_ROW: PrismaMovementPattern.CARDIO_ROW,
  CARDIO_OTHER: PrismaMovementPattern.CARDIO_OTHER,
  GYMNASTIC_HOLD: PrismaMovementPattern.GYMNASTIC_HOLD,
  GYMNASTIC_INVERTED: PrismaMovementPattern.GYMNASTIC_INVERTED,
  EXPLOSIVE: PrismaMovementPattern.EXPLOSIVE,
  COMBO: PrismaMovementPattern.COMBO,
};

export const MODALITY_MAP: Record<PrismaModality, Modality> = {
  BARBELL: "BARBELL",
  DUMBBELL: "DUMBBELL",
  KETTLEBELL: "KETTLEBELL",
  BODYWEIGHT: "BODYWEIGHT",
  CARDIO: "CARDIO",
  BANDED: "BANDED",
  MIXED: "MIXED",
  MACHINE: "MACHINE",
};

export const MODALITY_TO_PRISMA_MAP: Record<Modality, PrismaModality> = {
  BARBELL: PrismaModality.BARBELL,
  DUMBBELL: PrismaModality.DUMBBELL,
  KETTLEBELL: PrismaModality.KETTLEBELL,
  BODYWEIGHT: PrismaModality.BODYWEIGHT,
  CARDIO: PrismaModality.CARDIO,
  BANDED: PrismaModality.BANDED,
  MIXED: PrismaModality.MIXED,
  MACHINE: PrismaModality.MACHINE,
};

export const BODY_PART_MAP: Record<PrismaBodyPart, BodyPart> = {
  SHOULDERS: "SHOULDERS",
  CHEST: "CHEST",
  BACK: "BACK",
  ARMS_BICEPS: "ARMS_BICEPS",
  ARMS_TRICEPS: "ARMS_TRICEPS",
  CORE: "CORE",
  GLUTES: "GLUTES",
  HAMSTRINGS: "HAMSTRINGS",
  QUADS: "QUADS",
  CALVES: "CALVES",
  HIPS: "HIPS",
  POSTERIOR_CHAIN: "POSTERIOR_CHAIN",
  FULL_BODY: "FULL_BODY",
};

export const BODY_PART_TO_PRISMA_MAP: Record<BodyPart, PrismaBodyPart> = {
  SHOULDERS: PrismaBodyPart.SHOULDERS,
  CHEST: PrismaBodyPart.CHEST,
  BACK: PrismaBodyPart.BACK,
  ARMS_BICEPS: PrismaBodyPart.ARMS_BICEPS,
  ARMS_TRICEPS: PrismaBodyPart.ARMS_TRICEPS,
  CORE: PrismaBodyPart.CORE,
  GLUTES: PrismaBodyPart.GLUTES,
  HAMSTRINGS: PrismaBodyPart.HAMSTRINGS,
  QUADS: PrismaBodyPart.QUADS,
  CALVES: PrismaBodyPart.CALVES,
  HIPS: PrismaBodyPart.HIPS,
  POSTERIOR_CHAIN: PrismaBodyPart.POSTERIOR_CHAIN,
  FULL_BODY: PrismaBodyPart.FULL_BODY,
};

export const SKILL_LEVEL_MAP: Record<PrismaSkillLevel, SkillLevel> = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  ELITE: "ELITE",
};

export const SKILL_LEVEL_TO_PRISMA_MAP: Record<SkillLevel, PrismaSkillLevel> = {
  BEGINNER: PrismaSkillLevel.BEGINNER,
  INTERMEDIATE: PrismaSkillLevel.INTERMEDIATE,
  ADVANCED: PrismaSkillLevel.ADVANCED,
  ELITE: PrismaSkillLevel.ELITE,
};

export const PR_KIND_MAP: Record<PrismaPrKind, PrKind> = {
  ONE_REP_MAX: "ONE_REP_MAX",
  N_REP_MAX: "N_REP_MAX",
  MAX_REPS_UNBROKEN: "MAX_REPS_UNBROKEN",
  MAX_REPS_TOTAL: "MAX_REPS_TOTAL",
  BEST_TIME_FOR_X: "BEST_TIME_FOR_X",
  MAX_DISTANCE_IN_T: "MAX_DISTANCE_IN_T",
  MAX_CALORIES_IN_T: "MAX_CALORIES_IN_T",
  MAX_LOAD_FOR_REPS: "MAX_LOAD_FOR_REPS",
};

export const PR_KIND_TO_PRISMA_MAP: Record<PrKind, PrismaPrKind> = {
  ONE_REP_MAX: PrismaPrKind.ONE_REP_MAX,
  N_REP_MAX: PrismaPrKind.N_REP_MAX,
  MAX_REPS_UNBROKEN: PrismaPrKind.MAX_REPS_UNBROKEN,
  MAX_REPS_TOTAL: PrismaPrKind.MAX_REPS_TOTAL,
  BEST_TIME_FOR_X: PrismaPrKind.BEST_TIME_FOR_X,
  MAX_DISTANCE_IN_T: PrismaPrKind.MAX_DISTANCE_IN_T,
  MAX_CALORIES_IN_T: PrismaPrKind.MAX_CALORIES_IN_T,
  MAX_LOAD_FOR_REPS: PrismaPrKind.MAX_LOAD_FOR_REPS,
};
