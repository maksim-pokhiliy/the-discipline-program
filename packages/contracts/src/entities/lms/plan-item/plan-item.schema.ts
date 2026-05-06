import { z } from "zod";

import { prescriptionSchema } from "../_domain/prescription.schema";

import { PLAN_ITEM_CONSTANTS } from "./plan-item.constants";

export const planItemAlternativeSchema = z.object({
  exerciseId: z.string().cuid(),
  note: z.string().max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVE_NOTE_LENGTH).optional(),
});

export const planItemSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  prescription: prescriptionSchema,
  alternatives: z
    .array(planItemAlternativeSchema)
    .max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVES)
    .nullable(),
  notes: z.string().max(PLAN_ITEM_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanItemSchema = z.object({
  blockId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  prescription: prescriptionSchema,
  alternatives: z
    .array(planItemAlternativeSchema)
    .max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVES)
    .optional(),
  notes: z.string().max(PLAN_ITEM_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updatePlanItemSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  exerciseId: z.string().cuid().optional(),
  prescription: prescriptionSchema.optional(),
  alternatives: z
    .array(planItemAlternativeSchema)
    .max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVES)
    .nullable()
    .optional(),
  notes: z.string().max(PLAN_ITEM_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});
