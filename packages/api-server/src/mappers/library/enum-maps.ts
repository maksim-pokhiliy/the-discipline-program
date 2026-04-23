import {
  ExerciseStatus as PrismaExerciseStatus,
  MeasurementUnit as PrismaMeasurementUnit,
  SchemeKind as PrismaSchemeKind,
} from "@prisma/client";

import { ExerciseStatus, MeasurementUnit } from "@repo/contracts/library/exercise";
import { SchemeKind } from "@repo/contracts/library/scheme";

export const EXERCISE_STATUS_MAP: Record<PrismaExerciseStatus, ExerciseStatus> = {
  PENDING_REVIEW: ExerciseStatus.PENDING_REVIEW,
  APPROVED: ExerciseStatus.APPROVED,
  REJECTED: ExerciseStatus.REJECTED,
  MERGED: ExerciseStatus.MERGED,
};

export const EXERCISE_STATUS_TO_PRISMA_MAP: Record<ExerciseStatus, PrismaExerciseStatus> = {
  [ExerciseStatus.PENDING_REVIEW]: PrismaExerciseStatus.PENDING_REVIEW,
  [ExerciseStatus.APPROVED]: PrismaExerciseStatus.APPROVED,
  [ExerciseStatus.REJECTED]: PrismaExerciseStatus.REJECTED,
  [ExerciseStatus.MERGED]: PrismaExerciseStatus.MERGED,
};

export const MEASUREMENT_UNIT_MAP: Record<PrismaMeasurementUnit, MeasurementUnit> = {
  REPS: MeasurementUnit.REPS,
  TIME_SEC: MeasurementUnit.TIME_SEC,
  DISTANCE_M: MeasurementUnit.DISTANCE_M,
  CALORIES: MeasurementUnit.CALORIES,
};

export const MEASUREMENT_UNIT_TO_PRISMA_MAP: Record<MeasurementUnit, PrismaMeasurementUnit> = {
  [MeasurementUnit.REPS]: PrismaMeasurementUnit.REPS,
  [MeasurementUnit.TIME_SEC]: PrismaMeasurementUnit.TIME_SEC,
  [MeasurementUnit.DISTANCE_M]: PrismaMeasurementUnit.DISTANCE_M,
  [MeasurementUnit.CALORIES]: PrismaMeasurementUnit.CALORIES,
};

export const SCHEME_KIND_MAP: Record<PrismaSchemeKind, SchemeKind> = {
  STRAIGHT_SETS: SchemeKind.STRAIGHT_SETS,
  FOR_TIME: SchemeKind.FOR_TIME,
  AMRAP: SchemeKind.AMRAP,
  EMOM: SchemeKind.EMOM,
  EVERY_X_MIN: SchemeKind.EVERY_X_MIN,
  INTERVALS: SchemeKind.INTERVALS,
  TIME_BLOCKS: SchemeKind.TIME_BLOCKS,
};

export const SCHEME_KIND_TO_PRISMA_MAP: Record<SchemeKind, PrismaSchemeKind> = {
  [SchemeKind.STRAIGHT_SETS]: PrismaSchemeKind.STRAIGHT_SETS,
  [SchemeKind.FOR_TIME]: PrismaSchemeKind.FOR_TIME,
  [SchemeKind.AMRAP]: PrismaSchemeKind.AMRAP,
  [SchemeKind.EMOM]: PrismaSchemeKind.EMOM,
  [SchemeKind.EVERY_X_MIN]: PrismaSchemeKind.EVERY_X_MIN,
  [SchemeKind.INTERVALS]: PrismaSchemeKind.INTERVALS,
  [SchemeKind.TIME_BLOCKS]: PrismaSchemeKind.TIME_BLOCKS,
};
