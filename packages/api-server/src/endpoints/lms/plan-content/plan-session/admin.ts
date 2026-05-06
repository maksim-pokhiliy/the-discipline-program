import {
  type CreatePlanSessionRequest,
  type PlanSession,
  type UpdatePlanSessionData,
} from "@repo/contracts/lms/plan-session";
import { NotFoundError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../../authz/guards";
import { prisma } from "../../../../db/client";
import { mapToPlanSession } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../../utils";

const ensureDayBelongsToPlan = async (dayId: string, planId: string): Promise<void> => {
  const day = await prisma.planDay.findUnique({
    where: { id: dayId },
    select: { planId: true },
  });

  if (!day || day.planId !== planId) {
    throw new NotFoundError("Plan day not found", { dayId });
  }
};

const ensureSessionBelongsToPlan = async (sessionId: string, planId: string): Promise<void> => {
  const session = await prisma.planSession.findUnique({
    where: { id: sessionId },
    select: { day: { select: { planId: true } } },
  });

  if (!session || session.day.planId !== planId) {
    throw new NotFoundError("Plan session not found", { sessionId });
  }
};

export const lmsPlanSessionApi = {
  listByDay: async (userId: string, planId: string, dayId: string): Promise<PlanSession[]> => {
    await verifyPlanOwnership(planId, userId);
    await ensureDayBelongsToPlan(dayId, planId);

    const sessions = await prisma.planSession.findMany({
      where: { dayId },
      orderBy: { order: "asc" },
    });

    return sessions.map(mapToPlanSession);
  },

  getById: async (userId: string, planId: string, sessionId: string): Promise<PlanSession> => {
    await verifyPlanOwnership(planId, userId);
    await ensureSessionBelongsToPlan(sessionId, planId);

    const session = await findOrThrow(
      prisma.planSession.findUnique({ where: { id: sessionId } }),
      "Plan session",
    );

    return mapToPlanSession(session);
  },

  create: async (
    userId: string,
    planId: string,
    dayId: string,
    data: CreatePlanSessionRequest,
  ): Promise<PlanSession> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await ensureDayBelongsToPlan(dayId, planId);

    try {
      const session = await prisma.planSession.create({
        data: {
          dayId,
          order: data.order,
          ...(data.label !== undefined && { label: data.label }),
        },
      });

      return mapToPlanSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan session" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: UpdatePlanSessionData,
  ): Promise<PlanSession> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await ensureSessionBelongsToPlan(sessionId, planId);

    try {
      const session = await prisma.planSession.update({
        where: { id: sessionId },
        data: {
          ...(data.order !== undefined && { order: data.order }),
          ...(data.label !== undefined && { label: data.label }),
        },
      });

      return mapToPlanSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan session" });
    }
  },

  delete: async (userId: string, planId: string, sessionId: string): Promise<void> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);
    await ensureSessionBelongsToPlan(sessionId, planId);

    try {
      await prisma.planSession.delete({ where: { id: sessionId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan session" });
    }
  },
};
