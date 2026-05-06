import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreatePlanEnrollmentRequest,
  EnrollmentStatus,
  type PlanEnrollment,
} from "@repo/contracts/lms/plan-enrollment";
import { BadRequestError, ConflictError, NotFoundError } from "@repo/errors";

import {
  requireCoachLikeRole,
  resolveCoachId,
  verifyAthleteBelongsToCoach,
  verifyPlanOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { type TxClient } from "../../../db/tx";
import { ROLE_MAP } from "../../../mappers/iam";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP, mapToPlanEnrollment } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";

const ensureAthleteUser = async (athleteId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { role: true },
  });

  if (!user || ROLE_MAP[user.role] !== UserRole.ATHLETE) {
    throw new BadRequestError("athleteId must reference an ATHLETE user", {
      field: "athleteId",
    });
  }
};

const ensureCoachAssignmentIfNeeded = async (athleteId: string, userId: string): Promise<void> => {
  const role = await requireCoachLikeRole(userId);

  if (role !== UserRole.COACH) {
    return;
  }

  const coachId = await resolveCoachId(userId);

  await verifyAthleteBelongsToCoach(athleteId, coachId);
};

const buildListWhere = (
  planId: string,
  filter: { status?: EnrollmentStatus },
): Prisma.PlanEnrollmentWhereInput => {
  if (filter.status === EnrollmentStatus.REMOVED) {
    return { planId, status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.REMOVED] };
  }

  return {
    planId,
    deletedAt: null,
    ...(filter.status !== undefined && {
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[filter.status],
    }),
  };
};

type StatusTransitionArgs = {
  planId: string;
  enrollmentId: string;
  expected: EnrollmentStatus;
  target: EnrollmentStatus;
  errorMessage: string;
};

const runStatusTransition = async (tx: TxClient, args: StatusTransitionArgs) => {
  const result = await tx.planEnrollment.updateMany({
    where: {
      id: args.enrollmentId,
      planId: args.planId,
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[args.expected],
      deletedAt: null,
    },
    data: {
      status: ENROLLMENT_STATUS_TO_PRISMA_MAP[args.target],
      statusChangedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const existing = await tx.planEnrollment.findFirst({
      where: { id: args.enrollmentId, planId: args.planId },
    });

    if (!existing || existing.deletedAt !== null) {
      throw new NotFoundError("Plan enrollment not found", { enrollmentId: args.enrollmentId });
    }

    throw new ConflictError(args.errorMessage, {
      enrollmentId: args.enrollmentId,
      currentStatus: existing.status,
    });
  }

  return findOrThrow(
    tx.planEnrollment.findUnique({ where: { id: args.enrollmentId } }),
    "Plan enrollment",
  );
};

const transitionEnrollmentStatus = async (
  userId: string,
  args: StatusTransitionArgs,
): Promise<PlanEnrollment> => {
  await verifyPlanOwnership(args.planId, userId);

  try {
    const refreshed = await prisma.$transaction((tx) => runStatusTransition(tx, args));

    return mapToPlanEnrollment(refreshed);
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
      throw error;
    }

    return handlePrismaError(error, { entity: "Plan enrollment" });
  }
};

export const lmsPlanEnrollmentApi = {
  listByPlan: async (
    userId: string,
    planId: string,
    filter: { status?: EnrollmentStatus },
  ): Promise<PlanEnrollment[]> => {
    await verifyPlanOwnership(planId, userId);

    const enrollments = await prisma.planEnrollment.findMany({
      where: buildListWhere(planId, filter),
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map(mapToPlanEnrollment);
  },

  getById: async (
    userId: string,
    planId: string,
    enrollmentId: string,
  ): Promise<PlanEnrollment> => {
    await verifyPlanOwnership(planId, userId);

    const enrollment = await findOrThrow(
      prisma.planEnrollment.findUnique({ where: { id: enrollmentId } }),
      "Plan enrollment",
    );

    if (enrollment.planId !== planId) {
      throw new NotFoundError("Plan enrollment not found", { enrollmentId });
    }

    return mapToPlanEnrollment(enrollment);
  },

  create: async (
    userId: string,
    planId: string,
    data: CreatePlanEnrollmentRequest,
  ): Promise<PlanEnrollment> => {
    const plan = await verifyPlanOwnership(planId, userId);

    if (plan.status !== "ACTIVE") {
      throw new ConflictError("Plan must be ACTIVE to enroll athletes", {
        planId,
        currentStatus: plan.status,
      });
    }

    await ensureAthleteUser(data.athleteId);
    await ensureCoachAssignmentIfNeeded(data.athleteId, userId);

    const existingActive = await prisma.planEnrollment.findFirst({
      where: { planId, athleteId: data.athleteId, deletedAt: null },
      select: { id: true },
    });

    if (existingActive) {
      throw new ConflictError("Athlete is already enrolled in this plan", {
        planId,
        athleteId: data.athleteId,
      });
    }

    try {
      const enrollment = await prisma.planEnrollment.create({
        data: {
          planId,
          athleteId: data.athleteId,
          enrolledById: userId,
          boardedAt: data.boardedAt,
          status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE],
          statusChangedAt: new Date(),
        },
      });

      return mapToPlanEnrollment(enrollment);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan enrollment" });
    }
  },

  pause: async (userId: string, planId: string, enrollmentId: string): Promise<PlanEnrollment> =>
    transitionEnrollmentStatus(userId, {
      planId,
      enrollmentId,
      expected: EnrollmentStatus.ACTIVE,
      target: EnrollmentStatus.PAUSED,
      errorMessage: "Only active enrollments can be paused",
    }),

  resume: async (userId: string, planId: string, enrollmentId: string): Promise<PlanEnrollment> =>
    transitionEnrollmentStatus(userId, {
      planId,
      enrollmentId,
      expected: EnrollmentStatus.PAUSED,
      target: EnrollmentStatus.ACTIVE,
      errorMessage: "Only paused enrollments can be resumed",
    }),

  remove: async (userId: string, planId: string, enrollmentId: string): Promise<void> => {
    await verifyPlanOwnership(planId, userId);

    const existing = await prisma.planEnrollment.findFirst({
      where: { id: enrollmentId, planId },
      select: { deletedAt: true },
    });

    if (!existing) {
      throw new NotFoundError("Plan enrollment not found", { enrollmentId });
    }

    if (existing.deletedAt !== null) {
      return;
    }

    const now = new Date();

    try {
      await prisma.planEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.REMOVED],
          statusChangedAt: now,
          deletedAt: now,
        },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan enrollment" });
    }
  },
};
