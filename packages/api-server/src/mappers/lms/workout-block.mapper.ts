import {
  type EmomSlot as PrismaEmomSlot,
  type WorkoutBlock as PrismaWorkoutBlock,
  type WorkoutBlockExercise as PrismaWorkoutBlockExercise,
} from "@prisma/client";

import {
  type EmomSlot,
  type Prescription,
  prescriptionSchema,
  type SchemeConfig,
  schemeConfigSchema,
  type WorkoutBlock,
  type WorkoutBlockExercise,
} from "@repo/contracts/lms/workout-block";

import { SCHEME_KIND_MAP } from "../library/enum-maps";

import { WORKOUT_REP_SCHEME_MAP } from "./enum-maps";

type WorkoutBlockExerciseRow = PrismaWorkoutBlockExercise;

type EmomSlotRow = PrismaEmomSlot & {
  exercises?: WorkoutBlockExerciseRow[];
};

type WorkoutBlockRow = PrismaWorkoutBlock & {
  exercises?: WorkoutBlockExerciseRow[];
  emomSlots?: EmomSlotRow[];
};

const parsePrescription = (
  value: PrismaWorkoutBlockExercise["prescription"],
): Prescription | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = prescriptionSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};

const parseSchemeConfig = (value: PrismaWorkoutBlock["schemeConfig"]): SchemeConfig | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = schemeConfigSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};

export const toWorkoutBlockExerciseDto = (row: WorkoutBlockExerciseRow): WorkoutBlockExercise => ({
  id: row.id,
  blockId: row.blockId,
  emomSlotId: row.emomSlotId,
  exerciseId: row.exerciseId,
  repScheme: WORKOUT_REP_SCHEME_MAP[row.repScheme],
  repValues: row.repValues,
  sets: row.sets,
  prescription: parsePrescription(row.prescription),
  restSec: row.restSec,
  note: row.note,
  complexGroup: row.complexGroup,
  complexOrder: row.complexOrder,
  sortOrder: row.sortOrder,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const toEmomSlotDto = (row: EmomSlotRow): EmomSlot => ({
  id: row.id,
  blockId: row.blockId,
  minuteInRound: row.minuteInRound,
  sortOrder: row.sortOrder,
  note: row.note,
  exercises: row.exercises ? row.exercises.map(toWorkoutBlockExerciseDto) : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const toWorkoutBlockDto = (row: WorkoutBlockRow): WorkoutBlock => ({
  id: row.id,
  workoutId: row.workoutId,
  blockTypeId: row.blockTypeId,
  schemeId: row.schemeId,
  schemeKind: row.schemeKind ? SCHEME_KIND_MAP[row.schemeKind] : null,
  schemeConfig: parseSchemeConfig(row.schemeConfig),
  effortPct: row.effortPct,
  pace: row.pace,
  note: row.note,
  sortOrder: row.sortOrder,
  exercises: row.exercises ? row.exercises.map(toWorkoutBlockExerciseDto) : undefined,
  emomSlots: row.emomSlots ? row.emomSlots.map(toEmomSlotDto) : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
