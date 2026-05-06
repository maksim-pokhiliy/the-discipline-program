import { type PlanItem as PrismaPlanItem } from "@prisma/client";
import { z, type ZodTypeAny } from "zod";

import { prescriptionSchema } from "@repo/contracts/lms/_domain";
import {
  PLAN_ITEM_CONSTANTS,
  type PlanItem,
  planItemAlternativeSchema,
} from "@repo/contracts/lms/plan-item";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

const alternativesSchema = z
  .array(planItemAlternativeSchema)
  .max(PLAN_ITEM_CONSTANTS.MAX_ALTERNATIVES);

const parseFieldOrThrow = <S extends ZodTypeAny>(
  schema: S,
  raw: unknown,
  field: string,
  planItemId: string,
): z.output<S> => {
  const result = schema.safeParse(raw);

  if (!result.success) {
    logger.warn(`plan_item.${field}.parse_failed`, { planItemId, error: result.error.message });

    throw new InternalServerError(`Failed to parse PlanItem.${field}`);
  }

  return result.data;
};

export const mapToPlanItem = (p: PrismaPlanItem): PlanItem => ({
  id: p.id,
  blockId: p.blockId,
  order: p.order,
  exerciseId: p.exerciseId,
  prescription: parseFieldOrThrow(prescriptionSchema, p.prescription, "prescription", p.id),
  alternatives:
    p.alternatives === null
      ? null
      : parseFieldOrThrow(alternativesSchema, p.alternatives, "alternatives", p.id),
  notes: p.notes,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
