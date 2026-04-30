import { UserRole } from "@repo/contracts/iam/auth";
import { weekTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type ApplyWeekTemplateInput } from "@repo/contracts/lms/training-plan";
import { ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireCoachLikeRole, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { DAY_KIND_TO_PRISMA_MAP, DAY_OF_WEEK_TO_PRISMA_MAP } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";

import { cloneBlockSubtree } from "./clone-block-subtree";

export type ApplyWeekTemplateResult = { weekId: string };

export const applyWeekTemplate = async (
  userId: string,
  planId: string,
  data: ApplyWeekTemplateInput,
): Promise<ApplyWeekTemplateResult> => {
  await verifyPlanOwnership(planId, userId);
  const role = await requireCoachLikeRole(userId);

  const template = await findOrThrow(
    prisma.weekTemplate.findUnique({ where: { id: data.templateId } }),
    "Week template",
  );

  if (template.deletedAt !== null) {
    throw new NotFoundError("Week template not found", { templateId: data.templateId });
  }

  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  if (!isPrivileged && template.scope === "COACH" && template.ownerId !== userId) {
    throw new ForbiddenError("Week template belongs to another coach");
  }

  const parsed = weekTemplatePayloadSchema.safeParse(template.payload);

  if (!parsed.success) {
    throw new InternalServerError("Week template payload parse failure", {
      templateId: template.id,
      error: parsed.error.message,
    });
  }

  const existingWeek = await prisma.week.findFirst({
    where: { planId, index: data.target.index },
    select: { id: true },
  });

  if (existingWeek) {
    throw new ConflictError("Week with this index already exists in plan", {
      planId,
      weekIndex: data.target.index,
    });
  }

  const startedAtMs = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newWeek = await tx.week.create({
        data: {
          planId,
          index: data.target.index,
          label: parsed.data.week.label,
          notes: parsed.data.week.notes,
        },
      });

      for (const dayPayload of parsed.data.days) {
        const newDay = await tx.day.create({
          data: {
            weekId: newWeek.id,
            dayOfWeek: DAY_OF_WEEK_TO_PRISMA_MAP[dayPayload.dayOfWeek],
            kind: DAY_KIND_TO_PRISMA_MAP[dayPayload.kind],
            notes: dayPayload.notes,
          },
        });

        for (const sessionPayload of dayPayload.sessions) {
          const newSession = await tx.lmsSession.create({
            data: {
              dayId: newDay.id,
              order: sessionPayload.session.order,
              label: sessionPayload.session.label,
              notes: sessionPayload.session.notes,
            },
          });

          for (const [blockIndex, blockPayload] of sessionPayload.blocks.entries()) {
            await cloneBlockSubtree(tx, blockPayload, {
              sessionId: newSession.id,
              order: blockIndex,
            });
          }
        }
      }

      return { weekId: newWeek.id };
    });

    logger.info("lms.editor.template_applied", {
      userId,
      planId,
      templateId: data.templateId,
      kind: "week",
      durationMs: Date.now() - startedAtMs,
    });

    return result;
  } catch (error) {
    return handlePrismaError(error, { entity: "Week template apply" });
  }
};
