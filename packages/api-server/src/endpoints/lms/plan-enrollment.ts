import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreatePlanEnrollmentData,
  type PlanEnrollment,
  type UpdatePlanEnrollmentData,
} from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { mapToPlanEnrollment, PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

export const lmsPlanEnrollmentApi = {
  create: async (
    userId: string,
    planId: string,
    data: CreatePlanEnrollmentData,
  ): Promise<PlanEnrollment> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const athlete = await findOrThrow(
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, role: true },
      }),
      "User",
    );

    if (ROLE_MAP[athlete.role] !== UserRole.USER) {
      throw new ForbiddenError("Only USER role can be enrolled as athlete");
    }

    try {
      const enrollment = await prisma.planEnrollment.create({
        data: { trainingPlanId: planId, ...data },
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
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const existing = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { trainingPlanId: true },
    });

    if (!existing || existing.trainingPlanId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    try {
      const enrollment = await prisma.planEnrollment.update({
        where: { id: enrollmentId },
        data: {
          ...data,
          ...(data.status && { status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[data.status] }),
        },
      });

      return mapToPlanEnrollment(enrollment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Enrollment" });
    }
  },

  delete: async (userId: string, planId: string, enrollmentId: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const existing = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { trainingPlanId: true },
    });

    if (!existing || existing.trainingPlanId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    try {
      await prisma.planEnrollment.delete({ where: { id: enrollmentId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Enrollment" });
    }
  },
};
