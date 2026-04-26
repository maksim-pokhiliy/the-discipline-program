import { type CreatePlanCoachAssignmentInput } from "@repo/contracts/lms/plan-coach-assignment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToPlanCoachAssignment } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

export const lmsPlanCoachAssignmentApi = {
  list: async (userId: string, planId: string) => {
    await verifyPlanOwnership(planId, userId);

    const items = await prisma.planCoachAssignment.findMany({
      where: { planId },
      orderBy: { grantedAt: "asc" },
    });

    return { items: items.map(mapToPlanCoachAssignment), total: items.length };
  },

  getById: async (userId: string, planId: string, assignmentId: string) => {
    await verifyPlanOwnership(planId, userId);

    const assignment = await findOrThrow(
      prisma.planCoachAssignment.findUnique({ where: { id: assignmentId } }),
      "Plan coach assignment",
    );

    if (assignment.planId !== planId) {
      throw new NotFoundError("Plan coach assignment not found", { assignmentId, planId });
    }

    return mapToPlanCoachAssignment(assignment);
  },

  create: async (userId: string, planId: string, data: CreatePlanCoachAssignmentInput) => {
    await verifyPlanOwnership(planId, userId);

    const coach = await findOrThrow(
      prisma.user.findUnique({
        where: { id: data.coachId },
        select: { id: true, role: true },
      }),
      "Coach",
    );

    if (coach.role !== "COACH" && coach.role !== "HEAD_COACH" && coach.role !== "ADMIN") {
      throw new ForbiddenError("Only coach role users can be assigned to plans");
    }

    try {
      const assignment = await prisma.planCoachAssignment.create({
        data: {
          planId,
          coachId: data.coachId,
          canEdit: data.canEdit,
          grantedBy: userId,
        },
      });

      return mapToPlanCoachAssignment(assignment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan coach assignment" });
    }
  },

  delete: async (userId: string, planId: string, assignmentId: string): Promise<void> => {
    await verifyPlanOwnership(planId, userId);

    const existing = await prisma.planCoachAssignment.findUnique({
      where: { id: assignmentId },
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Plan coach assignment not found", { assignmentId, planId });
    }

    try {
      await prisma.planCoachAssignment.delete({ where: { id: assignmentId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan coach assignment" });
    }
  },
};
