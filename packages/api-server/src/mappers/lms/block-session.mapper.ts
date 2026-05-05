import {
  type BlockSession as PrismaBlockSession,
  type ExerciseLog as PrismaExerciseLog,
  type SetLog as PrismaSetLog,
} from "@prisma/client";

import { schemeParamsSchema } from "@repo/contracts/lms/_domain";
import { blockResultPrimarySchema, type BlockSession } from "@repo/contracts/lms/block-session";
import { type ExerciseLog } from "@repo/contracts/lms/exercise-log";
import { type SetLog } from "@repo/contracts/lms/set-log";

import { RX_STATUS_MAP, SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps";
import { mapToExerciseLogWithSetLogs } from "./exercise-log.mapper";

type ExerciseLogWithSetLogsRow = PrismaExerciseLog & { setLogs: PrismaSetLog[] };

export type BlockSessionWithExerciseLogsRow = PrismaBlockSession & {
  exerciseLogs: ExerciseLogWithSetLogsRow[];
};

export type BlockSessionWithExerciseLogs = BlockSession & {
  exerciseLogs: (ExerciseLog & { setLogs: SetLog[] })[];
};

export const mapToBlockSession = (b: PrismaBlockSession): BlockSession => ({
  id: b.id,
  workoutSessionId: b.workoutSessionId,
  order: b.order,
  blockNames: b.blockNames,
  weight: b.weight,
  archetypeKind: SCHEME_ARCHETYPE_KIND_MAP[b.archetypeKind],
  schemeParamsSnapshot: schemeParamsSchema.parse(b.schemeParamsSnapshot),
  startedAt: b.startedAt,
  completedAt: b.completedAt,
  durationSec: b.durationSec,
  rxStatus: RX_STATUS_MAP[b.rxStatus],
  resultPrimary: b.resultPrimary === null ? null : blockResultPrimarySchema.parse(b.resultPrimary),
  notes: b.notes,
});

export const mapToBlockSessionWithExerciseLogs = (
  b: BlockSessionWithExerciseLogsRow,
): BlockSessionWithExerciseLogs => ({
  ...mapToBlockSession(b),
  exerciseLogs: b.exerciseLogs.map(mapToExerciseLogWithSetLogs),
});
