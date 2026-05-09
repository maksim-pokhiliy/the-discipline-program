import { z } from "zod";

import { orderFieldSchema } from "../_domain/order.schema";
import { prescriptionSchema } from "../_domain/prescription.schema";
import { noNulByteString } from "../_domain/safe-string.schema";

import { PLAN_ITEM_CONSTANTS } from "./plan-item.constants";

export const planItemAlternativeSchema = z.object({
  exerciseId: z.string().cuid(),
  note: noNulByteString(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVE_NOTE_LENGTH).optional(),
});

const itemNotesSchema = noNulByteString(PLAN_ITEM_CONSTANTS.MAX_NOTES_LENGTH);

const alternativesArraySchema = z
  .array(planItemAlternativeSchema)
  .max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVES);

export const hasUniqueAlternativeIds = (
  alts: { exerciseId: string }[] | null | undefined,
): boolean => {
  if (!alts) {
    return true;
  }

  const ids = alts.map((a) => a.exerciseId);

  return new Set(ids).size === ids.length;
};

export const altsExcludePrimary = (
  alts: { exerciseId: string }[] | null | undefined,
  primary: string | undefined,
): boolean => {
  if (!alts || primary === undefined) {
    return true;
  }

  return !alts.some((a) => a.exerciseId === primary);
};

export const ALTERNATIVES_UNIQUE_MESSAGE = "alternatives must have unique exerciseIds";
export const ALTERNATIVES_NO_PRIMARY_MESSAGE =
  "alternatives must not include the primary exerciseId";

export const planItemSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  order: orderFieldSchema,
  exerciseId: z.string().cuid(),
  prescription: prescriptionSchema,
  alternatives: alternativesArraySchema.nullable(),
  notes: itemNotesSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanItemBaseSchema = z.object({
  blockId: z.string().cuid(),
  order: orderFieldSchema,
  exerciseId: z.string().cuid(),
  prescription: prescriptionSchema,
  alternatives: alternativesArraySchema.optional(),
  notes: itemNotesSchema.optional(),
});

export const updatePlanItemBaseSchema = z.object({
  order: orderFieldSchema.optional(),
  exerciseId: z.string().cuid().optional(),
  prescription: prescriptionSchema.optional(),
  alternatives: alternativesArraySchema.nullable().optional(),
  notes: itemNotesSchema.nullable().optional(),
});

export const createPlanItemSchema = createPlanItemBaseSchema
  .refine((data) => hasUniqueAlternativeIds(data.alternatives), {
    message: ALTERNATIVES_UNIQUE_MESSAGE,
    path: ["alternatives"],
  })
  .refine((data) => altsExcludePrimary(data.alternatives, data.exerciseId), {
    message: ALTERNATIVES_NO_PRIMARY_MESSAGE,
    path: ["alternatives"],
  });

export const updatePlanItemSchema = updatePlanItemBaseSchema
  .refine((data) => hasUniqueAlternativeIds(data.alternatives), {
    message: ALTERNATIVES_UNIQUE_MESSAGE,
    path: ["alternatives"],
  })
  .refine((data) => altsExcludePrimary(data.alternatives, data.exerciseId), {
    message: ALTERNATIVES_NO_PRIMARY_MESSAGE,
    path: ["alternatives"],
  });
