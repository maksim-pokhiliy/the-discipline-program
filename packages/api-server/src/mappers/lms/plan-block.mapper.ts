import {
  type PlanBlock as PrismaPlanBlock,
  type PlanBlockTypeRef as PrismaPlanBlockTypeRef,
} from "@prisma/client";

import { schemeParamsSchema, type SchemeParams } from "@repo/contracts/lms/_domain";
import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

export type PlanBlockWithRefsRow = PrismaPlanBlock & { blockTypeRefs: PrismaPlanBlockTypeRef[] };

export const parseSchemeParamsOrThrow = (
  raw: PrismaPlanBlock["schemeParams"],
  id: string,
): SchemeParams => {
  const result = schemeParamsSchema.safeParse(raw);

  if (!result.success) {
    logger.warn("plan_block.scheme_params.parse_failed", {
      planBlockId: id,
      error: result.error.message,
    });

    throw new InternalServerError("Failed to parse PlanBlock.schemeParams");
  }

  return result.data;
};

export const mapToPlanBlock = (p: PlanBlockWithRefsRow): PlanBlock => ({
  id: p.id,
  sessionId: p.sessionId,
  order: p.order,
  schemeTypeId: p.schemeTypeId,
  blockTypeIds: [...p.blockTypeRefs]
    .sort((a, b) => a.order - b.order)
    .map((ref) => ref.blockTypeId),
  schemeParams: parseSchemeParamsOrThrow(p.schemeParams, p.id),
  modifiers: p.modifiers,
  notes: p.notes,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
