import { type Workout as PrismaWorkout } from "@prisma/client";

import { type Workout } from "@repo/contracts/workout";

export const mapToWorkout = (w: PrismaWorkout): Workout => ({
  id: w.id,
  planId: w.planId,
  scheduledDate: w.scheduledDate,
  title: w.title,
  description: w.description,
  content: w.content,
  sortOrder: w.sortOrder,
  isArchived: w.isArchived,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
