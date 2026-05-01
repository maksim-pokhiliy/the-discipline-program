import { z } from "zod";

import { planIdParamSchema } from "../../../common";
import { createBlockInputSchema, blockSchema, updateBlockInputSchema } from "../block";
import {
  createBlockSegmentInputSchema,
  blockSegmentSchema,
  updateBlockSegmentInputSchema,
} from "../block-segment";
import {
  createExerciseEntryInputSchema,
  exerciseEntrySchema,
  updateExerciseEntryInputSchema,
} from "../exercise-entry";

import {
  createTrainingPlanSchema,
  trainingPlanListItemSchema,
  trainingPlanSchema,
  updateTrainingPlanSchema,
} from "./training-plan.schema";

export const getTrainingPlansResponseSchema = z.array(trainingPlanSchema);

export const coachPlansPageDataSchema = z.object({
  plans: z.array(trainingPlanListItemSchema),
});

export const getTrainingPlanByIdParamsSchema = planIdParamSchema;

export const getTrainingPlanResponseSchema = trainingPlanSchema;

export const createTrainingPlanRequestSchema = createTrainingPlanSchema;

export const createTrainingPlanResponseSchema = trainingPlanSchema;

export const updateTrainingPlanParamsSchema = planIdParamSchema;

export const updateTrainingPlanRequestSchema = updateTrainingPlanSchema;

export const updateTrainingPlanResponseSchema = trainingPlanSchema;

export const deleteTrainingPlanParamsSchema = planIdParamSchema;

export const duplicateTrainingPlanParamsSchema = planIdParamSchema;

export const duplicateTrainingPlanResponseSchema = trainingPlanSchema;

export const archiveTrainingPlanParamsSchema = planIdParamSchema;

export const restoreTrainingPlanParamsSchema = planIdParamSchema;

export const bulkPatchPlanParamsSchema = planIdParamSchema;

export const bulkPatchOpSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("update-block"),
    blockId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    fullEntity: updateBlockInputSchema.omit({ expectedVersion: true }),
  }),
  z.object({
    kind: z.literal("update-segment"),
    segmentId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    fullEntity: updateBlockSegmentInputSchema.omit({ expectedVersion: true }),
  }),
  z.object({
    kind: z.literal("update-entry"),
    entryId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    fullEntity: updateExerciseEntryInputSchema.omit({ expectedVersion: true }),
  }),
  z.object({
    kind: z.literal("move-block"),
    blockId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    targetSessionId: z.string().cuid(),
    targetOrder: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("move-segment"),
    segmentId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    targetBlockId: z.string().cuid(),
    targetOrder: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("move-entry"),
    entryId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
    targetSetGroupId: z.string().cuid(),
    targetOrder: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("create-block"),
    sessionId: z.string().cuid(),
    payload: createBlockInputSchema.omit({ sessionId: true }),
  }),
  z.object({
    kind: z.literal("create-segment"),
    blockId: z.string().cuid(),
    payload: createBlockSegmentInputSchema.omit({ blockId: true }),
  }),
  z.object({
    kind: z.literal("create-entry"),
    setGroupId: z.string().cuid(),
    payload: createExerciseEntryInputSchema.omit({ setGroupId: true }),
  }),
  z.object({
    kind: z.literal("delete-block"),
    blockId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
  }),
  z.object({
    kind: z.literal("delete-segment"),
    segmentId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
  }),
  z.object({
    kind: z.literal("delete-entry"),
    entryId: z.string().cuid(),
    expectedVersion: z.number().int().nonnegative().max(2_147_483_647),
  }),
  z.object({
    kind: z.literal("clone-block-subtree"),
    sourceBlockId: z.string().cuid(),
    targetSessionId: z.string().cuid(),
    targetOrder: z.number().int().nonnegative(),
  }),
]);

export const bulkPatchPlanInputSchema = z.object({
  ops: z.array(bulkPatchOpSchema).min(1).max(100),
});

export const bulkPatchConflictSchema = z.object({
  opIndex: z.number().int().nonnegative(),
  kind: z.string(),
  currentVersion: z.number().int().nonnegative(),
});

export const bulkPatchPlanResponseSchema = z.object({
  updated: z.object({
    blocks: z.array(blockSchema),
    segments: z.array(blockSegmentSchema),
    entries: z.array(exerciseEntrySchema),
  }),
  conflicts: z.array(bulkPatchConflictSchema).optional(),
});
