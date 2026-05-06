import {
  type BlockSession as PrismaBlockSession,
  type ExerciseLog as PrismaExerciseLog,
  type SetLog as PrismaSetLog,
  type WorkoutSession as PrismaWorkoutSession,
} from "@prisma/client";

import { type BlockSession } from "@repo/contracts/lms/block-session";
import { type ExerciseLog } from "@repo/contracts/lms/exercise-log";
import { type SetLog } from "@repo/contracts/lms/set-log";
import { type WorkoutSession } from "@repo/contracts/lms/workout-session";

import { mapToBlockSessionWithExerciseLogs } from "./block-session.mapper";
import { WORKOUT_SESSION_STATUS_MAP } from "./enum-maps";

type ExerciseLogWithSetLogsRow = PrismaExerciseLog & { setLogs: PrismaSetLog[] };
type BlockSessionWithExerciseLogsRow = PrismaBlockSession & {
  exerciseLogs: ExerciseLogWithSetLogsRow[];
};

export type WorkoutSessionWithBlockSessionsRow = PrismaWorkoutSession & {
  blockSessions: BlockSessionWithExerciseLogsRow[];
};

export type WorkoutSessionWithBlockSessions = WorkoutSession & {
  blockSessions: (BlockSession & {
    exerciseLogs: (ExerciseLog & { setLogs: SetLog[] })[];
  })[];
};

export const mapToWorkoutSession = (w: PrismaWorkoutSession): WorkoutSession => ({
  id: w.id,
  userId: w.userId,
  planSessionId: w.planSessionId,
  scheduledDate: w.scheduledDate,
  startedAt: w.startedAt,
  completedAt: w.completedAt,
  durationSec: w.durationSec,
  status: WORKOUT_SESSION_STATUS_MAP[w.status],
  perceivedExertion: w.perceivedExertion,
  mood: w.mood,
  notes: w.notes,
  completionRatio: w.completionRatio === null ? null : w.completionRatio.toNumber(),
});

export const mapToWorkoutSessionWithBlockSessions = (
  w: WorkoutSessionWithBlockSessionsRow,
): WorkoutSessionWithBlockSessions => ({
  ...mapToWorkoutSession(w),
  blockSessions: w.blockSessions.map(mapToBlockSessionWithExerciseLogs),
});
