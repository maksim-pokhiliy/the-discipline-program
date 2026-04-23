import {
  type EmomSlot as PrismaEmomSlot,
  type Workout as PrismaWorkout,
  type WorkoutBlock as PrismaWorkoutBlock,
  type WorkoutBlockExercise as PrismaWorkoutBlockExercise,
} from "@prisma/client";

import { tiptapDocSchema, type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import { type Workout, type WorkoutWithBlocks } from "@repo/contracts/lms/workout";

import { toWorkoutBlockDto } from "./workout-block.mapper";

type WorkoutRow = PrismaWorkout;

type WorkoutBlockWithRelationsRow = PrismaWorkoutBlock & {
  exercises?: PrismaWorkoutBlockExercise[];
  emomSlots?: (PrismaEmomSlot & { exercises?: PrismaWorkoutBlockExercise[] })[];
};

type WorkoutWithBlocksRow = WorkoutRow & {
  blocks: WorkoutBlockWithRelationsRow[];
};

const parseContentDoc = (value: PrismaWorkout["contentDoc"]): TiptapDoc | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = tiptapDocSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};

export const mapToWorkout = (w: WorkoutRow): Workout => ({
  id: w.id,
  planId: w.planId,
  scheduledDate: w.scheduledDate,
  title: w.title,
  description: w.description,
  contentDoc: parseContentDoc(w.contentDoc),
  sortOrder: w.sortOrder,
  isArchived: w.isArchived,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

export const mapToWorkoutWithBlocks = (w: WorkoutWithBlocksRow): WorkoutWithBlocks => ({
  ...mapToWorkout(w),
  blocks: w.blocks.map(toWorkoutBlockDto),
});
