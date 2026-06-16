import { type Exercise as PrismaExercise } from "@prisma/client";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { NATURE_MAP } from "./exercise.enum-maps";

export const mapToExercise = (row: PrismaExercise): Exercise => ({
  id: row.id,
  canonicalName: row.canonicalName,
  canonicalNameLower: row.canonicalNameLower,
  nature: NATURE_MAP[row.nature],
  movementFamily: row.movementFamily,
  defaultDemoUrls: row.defaultDemoUrls,
  aliases: (row.aliases as string[] | null) ?? [],
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
