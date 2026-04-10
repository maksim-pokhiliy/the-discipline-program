import {
  type CreatePlanEnrollmentData,
  type PlanEnrollment,
  type UpdatePlanEnrollmentData,
} from "@repo/contracts/lms/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToPlanEnrollment } from "../../mappers";
import { PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";
import { handlePrismaError } from "../../utils";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

const includeEnriched = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      athleteProfile: { select: { healthStatus: true } },
    },
  },
} as const;

export const platformPlanEnrollmentsApi = {
  getAll: async (userId: string, planId: string): Promise<PlanEnrollment[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: { trainingPlanId: planId },
      include: includeEnriched,
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map(mapToPlanEnrollment);
  },

  getById: async (
    userId: string,
    planId: string,
    enrollmentId: string,
  ): Promise<PlanEnrollment> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollment = await prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      include: includeEnriched,
    });

    if (!enrollment || enrollment.trainingPlanId !== planId) {
      throw new NotFoundError("Enrollment not found", { enrollmentId, planId });
    }

    return mapToPlanEnrollment(enrollment);
  },

  create: async (
    userId: string,
    planId: string,
    data: CreatePlanEnrollmentData,
  ): Promise<PlanEnrollment> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundError("User not found", { userId: data.userId });
    }

    try {
      const enrollment = await prisma.planEnrollment.create({
        data: { trainingPlanId: planId, ...data },
        include: includeEnriched,
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
        include: includeEnriched,
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
