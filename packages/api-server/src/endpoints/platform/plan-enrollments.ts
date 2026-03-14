import {
  type CreatePlanEnrollmentData,
  type PlanEnrollment,
  type UpdatePlanEnrollmentData,
} from "@repo/contracts/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToPlanEnrollment } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

const includeUser = {
  user: { select: { id: true, name: true, email: true, image: true } },
} as const;

export const platformPlanEnrollmentsApi = {
  getAll: async (userId: string, planId: string): Promise<PlanEnrollment[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(planId, coachId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: { trainingPlanId: planId },
      include: includeUser,
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
      include: includeUser,
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

    const enrollment = await prisma.planEnrollment.create({
      data: { trainingPlanId: planId, ...data },
      include: includeUser,
    });

    return mapToPlanEnrollment(enrollment);
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

    const enrollment = await prisma.planEnrollment.update({
      where: { id: enrollmentId },
      data,
      include: includeUser,
    });

    return mapToPlanEnrollment(enrollment);
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

    await prisma.planEnrollment.delete({ where: { id: enrollmentId } });
  },
};
