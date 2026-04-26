import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreatePlanEnrollmentData,
  type PlanEnrollment,
  type UpdatePlanEnrollmentData,
} from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { mapToPlanEnrollment, PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

const toDateOnly = (date: Date): Date => {
  const d = new Date(date);

  d.setUTCHours(0, 0, 0, 0);

  return d;
};

export const lmsPlanEnrollmentApi = {
  create: async (
    userId: string,
    planId: string,
    data: CreatePlanEnrollmentData,
  ): Promise<PlanEnrollment> => {
    await verifyPlanOwnership(planId, userId);

    const athlete = await findOrThrow(
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, role: true },
      }),
      "User",
    );

    if (ROLE_MAP[athlete.role] !== UserRole.ATHLETE) {
      throw new ForbiddenError("Only ATHLETE role can be enrolled");
    }

    try {
      const enrollment = await prisma.planEnrollment.create({
        data: {
          planId,
          userId: data.userId,
          startedAtWeekIndex: data.startedAtWeekIndex ?? 0,
          startedOnDate: toDateOnly(data.startedOnDate ?? new Date()),
        },
      });

      return mapToPlanEnrollment(enrollment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Enrollment" });
    }
  },

  update: async (
    userId: string,
    planId: string,
    enrollmentId: string,
    data: UpdatePlanEnrollmentData,
  ): Promise<PlanEnrollment> => {
    await verifyPlanOwnership(planId, userId);

    const existing = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    try {
      const enrollment = await prisma.planEnrollment.update({
        where: { id: enrollmentId },
        data: {
          ...(data.endedOnDate !== undefined && {
            endedOnDate: data.endedOnDate ? toDateOnly(data.endedOnDate) : null,
          }),
          ...(data.status && { status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[data.status] }),
        },
      });

      return mapToPlanEnrollment(enrollment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Enrollment" });
    }
  },

  delete: async (userId: string, planId: string, enrollmentId: string): Promise<void> => {
    await verifyPlanOwnership(planId, userId);

    const existing = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { planId: true },
    });

    if (!existing || existing.planId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    try {
      await prisma.planEnrollment.delete({ where: { id: enrollmentId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Enrollment" });
    }
  },
};
