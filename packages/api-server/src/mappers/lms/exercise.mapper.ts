import { type Exercise as PrismaExercise } from "@prisma/client";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { MOVEMENT_PATTERN_MAP, PR_KIND_MAP } from "./enum-maps-taxonomy";

export const mapToExercise = (e: PrismaExercise): Exercise => ({
  id: e.id,
  name: e.name,
  urls: e.urls,
  primaryMovement: MOVEMENT_PATTERN_MAP[e.primaryMovement],
  benchmarkPrKind: e.benchmarkPrKind === null ? null : PR_KIND_MAP[e.benchmarkPrKind],
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});
