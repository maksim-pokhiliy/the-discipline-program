import { type Exercise as PrismaExercise } from "@prisma/client";

import { type Exercise } from "@repo/contracts/lms/exercise";

import {
  CANONICAL_COMPOUND_TYPE_MAP,
  EQUIPMENT_MAP,
  MOVEMENT_TYPE_MAP,
} from "./exercise.enum-maps";

export const mapToExercise = (row: PrismaExercise): Exercise => ({
  id: row.id,
  canonicalName: row.canonicalName,
  canonicalNameLower: row.canonicalNameLower,
  primaryEquipment: EQUIPMENT_MAP[row.primaryEquipment],
  movementTypeTagPrimary: MOVEMENT_TYPE_MAP[row.movementTypeTagPrimary],
  movementTypeTagSecondary: row.movementTypeTagSecondary
    ? MOVEMENT_TYPE_MAP[row.movementTypeTagSecondary]
    : null,
  canonicalCompoundType: CANONICAL_COMPOUND_TYPE_MAP[row.canonicalCompoundType],
  placeholderFlag: row.placeholderFlag,
  movementFamily: row.movementFamily,
  defaultDemoUrls: row.defaultDemoUrls,
  aliases: (row.aliases as string[] | null) ?? [],
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
