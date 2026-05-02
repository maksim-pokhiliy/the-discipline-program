import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type ExerciseSnapshot,
  weekTemplatePayloadSchema,
  type WeekTemplatePayload,
} from "@repo/contracts/lms/_domain";
import { type ApplyWeekTemplateInput } from "@repo/contracts/lms/training-plan";
import { ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireCoachLikeRole, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { TX_BUDGET_LONG } from "../../../db/transaction-config";
import { type TxClient } from "../../../db/tx";
import { DAY_KIND_TO_PRISMA_MAP, DAY_OF_WEEK_TO_PRISMA_MAP } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { buildExerciseSnapshotMap } from "../derive-exercise-snapshot";

import {
  buildBlockCreateWithoutSessionInput,
  collectBlockExerciseIds,
} from "./clone-block-subtree";

export type ApplyWeekTemplateResult = { weekId: string };

const collectWeekExerciseIds = (payload: WeekTemplatePayload): string[] => {
  const ids: string[] = [];

  for (const day of payload.days) {
    for (const session of day.sessions) {
      for (const block of session.blocks) {
        ids.push(...collectBlockExerciseIds(block));
      }
    }
  }

  return ids;
};

const buildWeekDaysCreate = (
  payload: WeekTemplatePayload,
  snapshotMap: Map<string, ExerciseSnapshot>,
): Prisma.DayUncheckedCreateWithoutWeekInput[] =>
  payload.days.map((dayPayload) => ({
    dayOfWeek: DAY_OF_WEEK_TO_PRISMA_MAP[dayPayload.dayOfWeek],
    kind: DAY_KIND_TO_PRISMA_MAP[dayPayload.kind],
    notes: dayPayload.notes,
    sessions: {
      create: dayPayload.sessions.map((sessionPayload) => ({
        order: sessionPayload.session.order,
        label: sessionPayload.session.label,
        notes: sessionPayload.session.notes,
        blocks: {
          create: sessionPayload.blocks.map((blockPayload, blockIndex) =>
            buildBlockCreateWithoutSessionInput(blockPayload, snapshotMap, blockIndex),
          ),
        },
      })),
    },
  }));

const ensureWeekIndexFree = async (tx: TxClient, planId: string, index: number): Promise<void> => {
  const existingWeek = await tx.week.findFirst({
    where: { planId, index },
    select: { id: true },
  });

  if (existingWeek) {
    throw new ConflictError("Week with this index already exists in plan", {
      planId,
      weekIndex: index,
    });
  }
};

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

  const startedAtMs = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      await ensureWeekIndexFree(tx, planId, data.target.index);

      const snapshotMap = await buildExerciseSnapshotMap(tx, collectWeekExerciseIds(parsed.data));
      const newWeek = await tx.week.create({
        data: {
          planId,
          index: data.target.index,
          label: parsed.data.week.label,
          notes: parsed.data.week.notes,
          days: { create: buildWeekDaysCreate(parsed.data, snapshotMap) },
        },
        select: { id: true },
      });

      return { weekId: newWeek.id };
    }, TX_BUDGET_LONG);

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
