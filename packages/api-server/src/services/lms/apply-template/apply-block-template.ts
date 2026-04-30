import { UserRole } from "@repo/contracts/iam/auth";
import { blockTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type ApplyBlockTemplateInput } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, InternalServerError, NotFoundError, ValidationError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireCoachLikeRole, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { findOrThrow, handlePrismaError } from "../../../utils";

import { cloneBlockSubtree } from "./clone-block-subtree";

export type ApplyBlockTemplateResult = { blockId: string };

export const applyBlockTemplate = async (
  userId: string,
  planId: string,
  data: ApplyBlockTemplateInput,
): Promise<ApplyBlockTemplateResult> => {
  await verifyPlanOwnership(planId, userId);
  const role = await requireCoachLikeRole(userId);

  const template = await findOrThrow(
    prisma.blockTemplate.findUnique({ where: { id: data.templateId } }),
    "Block template",
  );

  if (template.deletedAt !== null) {
    throw new NotFoundError("Block template not found", { templateId: data.templateId });
  }

  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  if (!isPrivileged && template.scope === "COACH" && template.ownerId !== userId) {
    throw new ForbiddenError("Block template belongs to another coach");
  }

  const parsed = blockTemplatePayloadSchema.safeParse(template.payload);

  if (!parsed.success) {
    throw new InternalServerError("Block template payload parse failure", {
      templateId: template.id,
      error: parsed.error.message,
    });
  }

  const session = await findOrThrow(
    prisma.lmsSession.findUnique({
      where: { id: data.target.sessionId },
      select: { id: true, day: { select: { week: { select: { planId: true } } } } },
    }),
    "Session",
  );

  if (session.day.week.planId !== planId) {
    throw new ValidationError("Target session does not belong to this plan", {
      planId,
      sessionId: data.target.sessionId,
    });
  }

  const startedAtMs = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      return cloneBlockSubtree(tx, parsed.data, {
        sessionId: data.target.sessionId,
        order: data.target.order,
      });
    });

    logger.info("lms.editor.template_applied", {
      userId,
      planId,
      templateId: data.templateId,
      kind: "block",
      durationMs: Date.now() - startedAtMs,
    });

    return result;
  } catch (error) {
    return handlePrismaError(error, { entity: "Block template apply" });
  }
};
