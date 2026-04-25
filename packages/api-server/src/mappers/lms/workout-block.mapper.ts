import { type WorkoutBlock as PrismaWorkoutBlock } from "@prisma/client";

import { type WorkoutBlock } from "@repo/contracts/lms/workout-block";

import { type SchemeSectionRow, toSchemeSectionDto } from "./scheme-section.mapper";

type WorkoutBlockRow = PrismaWorkoutBlock & {
  sections?: SchemeSectionRow[];
};

export const toWorkoutBlockDto = (row: WorkoutBlockRow): WorkoutBlock => ({
  id: row.id,
  workoutId: row.workoutId,
  blockTypeId: row.blockTypeId,
  title: row.title,
  sortOrder: row.sortOrder,
  sections: row.sections ? row.sections.map(toSchemeSectionDto) : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
