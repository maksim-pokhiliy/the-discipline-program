import { type Workout as PrismaWorkout } from "@prisma/client";

import { type Workout } from "@repo/contracts/workout";

type WorkoutWithCount = PrismaWorkout & {
  _count: { blocks: number };
};

export const mapToWorkout = (w: WorkoutWithCount): Workout => ({
  id: w.id,
  planId: w.planId,
  scheduledDate: w.scheduledDate,
  title: w.title,
  description: w.description,
  blockCount: w._count.blocks,
  sortOrder: w.sortOrder,
  isArchived: w.isArchived,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
