import { MovementPattern as PrismaMovementPattern } from "@prisma/client";

import { type MovementPattern } from "@repo/contracts/lms/_domain";

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
