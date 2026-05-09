import { z } from "zod";

import { noNulByteString } from "../_domain/safe-string.schema";
import { schemeParamsSchema } from "../_domain/scheme-archetype.schema";
import { planItemForUpsertSchema } from "../plan-item/plan-item-for-upsert.schema";

import { PLAN_BLOCK_CONSTANTS } from "./plan-block.constants";

const blockTypeIdsSchema = z
  .array(z.string().cuid())
  .min(PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES)
  .max(PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "blockTypeIds must be unique",
  });

const blockNotesSchema = noNulByteString(PLAN_BLOCK_CONSTANTS.MAX_NOTES_LENGTH);

const hasUniqueItemIds = (
  items: ReadonlyArray<z.infer<typeof planItemForUpsertSchema>>,
): boolean => {
  const ids = items.map((i) => i.id).filter((id): id is string => id !== undefined);

  return new Set(ids).size === ids.length;
};

const itemsArraySchema = z
  .array(planItemForUpsertSchema)
  .max(PLAN_BLOCK_CONSTANTS.MAX_ITEMS_PER_BLOCK, {
    message: `items must contain at most ${PLAN_BLOCK_CONSTANTS.MAX_ITEMS_PER_BLOCK} entries`,
  })
  .refine(hasUniqueItemIds, { message: "items must have unique ids" });

export const planBlockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  schemeTypeId: z.string().cuid(),
  blockTypeIds: blockTypeIdsSchema,
  schemeParams: schemeParamsSchema,
  modifiers: z.unknown().nullable(),
  notes: blockNotesSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanBlockSchema = z.object({
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  schemeTypeId: z.string().cuid(),
  blockTypeIds: blockTypeIdsSchema,
  modifiers: z.unknown().optional(),
  notes: blockNotesSchema.optional(),
  items: itemsArraySchema.optional(),
});

export const updatePlanBlockSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  schemeTypeId: z.string().cuid().optional(),
  blockTypeIds: blockTypeIdsSchema.optional(),
  schemeParams: schemeParamsSchema.optional(),
  modifiers: z.unknown().nullable().optional(),
  notes: blockNotesSchema.nullable().optional(),
  items: itemsArraySchema.optional(),
});
