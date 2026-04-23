import { z } from "zod";

import { tiptapDocSchema } from "../../../common/tiptap-doc";
import { workoutBlockSchema } from "../workout-block/workout-block.schema";

import { WORKOUT_CONSTANTS } from "./workout.constants";

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  scheduledDate: z.date().nullable(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH),
  description: z.string().nullable(),
  contentDoc: tiptapDocSchema.nullable(),
  sortOrder: z.number().int().nonnegative(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workoutWithBlocksSchema = workoutSchema.extend({
  blocks: z.array(workoutBlockSchema),
});

export const createWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  description: z.string().max(WORKOUT_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  contentDoc: tiptapDocSchema.nullable().optional(),
});

export const updateWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().nullable().optional(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  description: z.string().max(WORKOUT_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable().optional(),
  contentDoc: tiptapDocSchema.nullable().optional(),
  isArchived: z.boolean().optional(),
});
