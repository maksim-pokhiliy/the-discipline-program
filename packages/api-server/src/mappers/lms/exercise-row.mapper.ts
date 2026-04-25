import {
  type EmomSlot as PrismaEmomSlot,
  type WorkoutBlockExercise as PrismaWorkoutBlockExercise,
} from "@prisma/client";

import {
  type EmomSlot,
  type Prescription,
  prescriptionSchema,
  type WorkoutBlockExercise,
} from "@repo/contracts/lms/workout-block";

import { WORKOUT_REP_SCHEME_MAP } from "./enum-maps";

export type WorkoutBlockExerciseRow = PrismaWorkoutBlockExercise;

export type EmomSlotRow = PrismaEmomSlot & {
  exercises?: WorkoutBlockExerciseRow[];
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

export const toWorkoutBlockExerciseDto = (row: WorkoutBlockExerciseRow): WorkoutBlockExercise => ({
  id: row.id,
  sectionId: row.sectionId,
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
  sectionId: row.sectionId,
  minuteInRound: row.minuteInRound,
  sortOrder: row.sortOrder,
  note: row.note,
  exercises: row.exercises ? row.exercises.map(toWorkoutBlockExerciseDto) : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
