import { UserRole } from "@repo/contracts/iam/auth";
import { sessionTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type ApplySessionTemplateInput } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, InternalServerError, NotFoundError, ValidationError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireCoachLikeRole, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { findOrThrow, handlePrismaError } from "../../../utils";

import { cloneBlockSubtree } from "./clone-block-subtree";

export type ApplySessionTemplateResult = { sessionId: string };

export const applySessionTemplate = async (
  userId: string,
  planId: string,
  data: ApplySessionTemplateInput,
): Promise<ApplySessionTemplateResult> => {
  await verifyPlanOwnership(planId, userId);
  const role = await requireCoachLikeRole(userId);

  const template = await findOrThrow(
    prisma.sessionTemplate.findUnique({ where: { id: data.templateId } }),
    "Session template",
  );

  if (template.deletedAt !== null) {
    throw new NotFoundError("Session template not found", { templateId: data.templateId });
  }

  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  if (!isPrivileged && template.scope === "COACH" && template.ownerId !== userId) {
    throw new ForbiddenError("Session template belongs to another coach");
  }

  const parsed = sessionTemplatePayloadSchema.safeParse(template.payload);

  if (!parsed.success) {
    throw new InternalServerError("Session template payload parse failure", {
      templateId: template.id,
      error: parsed.error.message,
    });
  }

  const day = await findOrThrow(
    prisma.day.findUnique({
      where: { id: data.target.dayId },
      select: { id: true, week: { select: { planId: true } } },
    }),
    "Day",
  );

  if (day.week.planId !== planId) {
    throw new ValidationError("Target day does not belong to this plan", {
      planId,
      dayId: data.target.dayId,
    });
  }

  const startedAtMs = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newSession = await tx.lmsSession.create({
        data: {
          dayId: data.target.dayId,
          order: data.target.order,
          label: parsed.data.session.label,
          notes: parsed.data.session.notes,
        },
      });

      for (const [blockIndex, blockPayload] of parsed.data.blocks.entries()) {
        await cloneBlockSubtree(tx, blockPayload, {
          sessionId: newSession.id,
          order: blockIndex,
        });
      }

      return { sessionId: newSession.id };
    });

    logger.info("lms.editor.template_applied", {
      planId,
      templateId: data.templateId,
      kind: "session",
      durationMs: Date.now() - startedAtMs,
    });

    return result;
  } catch (error) {
    return handlePrismaError(error, { entity: "Session template apply" });
  }
};
