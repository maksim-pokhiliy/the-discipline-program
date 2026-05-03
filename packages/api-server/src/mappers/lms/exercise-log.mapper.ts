import { type ExerciseLog as PrismaExerciseLog, type SetLog as PrismaSetLog } from "@prisma/client";

import { exerciseSnapshotSchema } from "@repo/contracts/lms/_domain";
import { type ExerciseLog } from "@repo/contracts/lms/exercise-log";
import { type SetLog } from "@repo/contracts/lms/set-log";

import { RX_STATUS_MAP } from "./enum-maps";
import { mapToSetLog } from "./set-log.mapper";

export type ExerciseLogWithSetLogsRow = PrismaExerciseLog & { setLogs: PrismaSetLog[] };

export type ExerciseLogWithSetLogs = ExerciseLog & { setLogs: SetLog[] };

export const mapToExerciseLog = (e: PrismaExerciseLog): ExerciseLog => ({
  id: e.id,
  blockSessionId: e.blockSessionId,
  order: e.order,
  exerciseSnapshot: exerciseSnapshotSchema.parse(e.exerciseSnapshot),
  rxStatus: RX_STATUS_MAP[e.rxStatus],
  substituteExerciseId: e.substituteExerciseId,
  notes: e.notes,
});

export const mapToExerciseLogWithSetLogs = (
  e: ExerciseLogWithSetLogsRow,
): ExerciseLogWithSetLogs => ({
  ...mapToExerciseLog(e),
  setLogs: e.setLogs.map(mapToSetLog),
});
