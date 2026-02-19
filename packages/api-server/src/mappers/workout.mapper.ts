import { type Workout as PrismaWorkout } from "@prisma/client";

import { type Workout } from "@repo/contracts/workout";

export const mapToWorkout = (w: PrismaWorkout): Workout => ({
  id: w.id,
  planId: w.planId,
  dayOrder: w.dayOrder,
  title: w.title,
  description: w.description,
  isArchived: w.isArchived,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
