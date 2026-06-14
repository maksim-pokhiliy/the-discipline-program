import {
  type Equipment as PrismaEquipment,
  type Exercise as PrismaExercise,
  type ExerciseEquipmentAssignment as PrismaExerciseEquipmentAssignment,
} from "@prisma/client";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { mapToEquipment } from "./equipment.mapper";
import { NATURE_MAP } from "./exercise.enum-maps";

export type PrismaExerciseWithEquipment = PrismaExercise & {
  equipmentAssignments: (PrismaExerciseEquipmentAssignment & { equipment: PrismaEquipment })[];
};

export const mapToExercise = (row: PrismaExerciseWithEquipment): Exercise => ({
  id: row.id,
  canonicalName: row.canonicalName,
  canonicalNameLower: row.canonicalNameLower,
  nature: NATURE_MAP[row.nature],
  movementFamily: row.movementFamily,
  defaultDemoUrls: row.defaultDemoUrls,
  aliases: (row.aliases as string[] | null) ?? [],
  equipment: [...row.equipmentAssignments]
    .sort((a, b) => a.order - b.order)
    .map((a) => mapToEquipment(a.equipment)),
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
