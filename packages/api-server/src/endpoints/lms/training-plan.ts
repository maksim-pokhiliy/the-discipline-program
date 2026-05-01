import { type Prisma, type TrainingPlan as PrismaTrainingPlan } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import {
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  TrainingPlanStatus,
  type UpdateTrainingPlanData,
} from "@repo/contracts/lms/training-plan";
import { ConflictError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  mapToTrainingPlan,
  PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP,
  TRAINING_PLAN_STATUS_MAP,
  TRAINING_PLAN_STATUS_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";
import { DEFAULT_LIST_LIMIT } from "../../utils/list-limits";

import { cloneWeeksIntoPlan } from "./plan-clone";

type PlanWithStats = PrismaTrainingPlan & {
  _count: { enrollments: number };
};

const mapToListItem = (p: PlanWithStats): TrainingPlanListItem => ({
  ...mapToTrainingPlan(p),
  enrolledAthletesCount: p._count.enrollments,
});

const buildPlanFilter = async (userId: string): Promise<Prisma.TrainingPlanWhereInput> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user) {
    const role = ROLE_MAP[user.role];

    if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
      return { deletedAt: null };
    }
  }

  return {
    deletedAt: null,
    OR: [{ creatorId: userId }, { coachAssignments: { some: { coachId: userId } } }],
  };
};

const transitionPlanStatus = async (
  userId: string,
  id: string,
  expectedCurrentStatus: TrainingPlanStatus,
  targetStatus: TrainingPlanStatus,
  errorMessage: string,
): Promise<TrainingPlan> => {
  await verifyPlanOwnership(id, userId);

  const plan = await findOrThrow(
    prisma.trainingPlan.findUnique({ where: { id }, select: { status: true } }),
    "Training plan",
  );

  if (TRAINING_PLAN_STATUS_MAP[plan.status] !== expectedCurrentStatus) {
    throw new ConflictError(errorMessage);
  }

  try {
    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[targetStatus] },
    });

    return mapToTrainingPlan(updated);
  } catch (error) {
    return handlePrismaError(error, { entity: "Training plan" });
  }
};

export const lmsTrainingPlanApi = {
  getAll: async (userId: string): Promise<TrainingPlan[]> => {
    const where = await buildPlanFilter(userId);

    const plans = await prisma.trainingPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
    });

    return plans.map(mapToTrainingPlan);
  },

  getPageData: async (userId: string): Promise<CoachPlansPageData> => {
    const where = await buildPlanFilter(userId);

    const plans = await prisma.trainingPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
              },
            },
          },
        },
      },
    });

    return { plans: plans.map(mapToListItem) };
  },

  getById: async (userId: string, id: string): Promise<TrainingPlan> => {
    await verifyPlanOwnership(id, userId);

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError("Training plan not found", { id });
    }

    return mapToTrainingPlan(plan);
  },

  create: async (userId: string, data: CreateTrainingPlanData): Promise<TrainingPlan> => {
    try {
      const plan = await prisma.trainingPlan.create({
        data: { creatorId: userId, ...data },
      });

      return mapToTrainingPlan(plan);
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan", field: "name" });
    }
  },

  update: async (
    userId: string,
    id: string,
    data: UpdateTrainingPlanData,
  ): Promise<TrainingPlan> => {
    await verifyPlanOwnership(id, userId);

    try {
      const plan = await prisma.trainingPlan.update({
        where: { id },
        data,
      });

      return mapToTrainingPlan(plan);
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan", field: "name" });
    }
  },

  delete: async (userId: string, id: string): Promise<void> => {
    await verifyPlanOwnership(id, userId);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.planEnrollment.deleteMany({ where: { planId: id } });
        await tx.product.updateMany({
          where: { trainingPlanId: id },
          data: { trainingPlanId: null },
        });
        await tx.trainingPlan.delete({ where: { id } });
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan" });
    }
  },

  duplicate: async (userId: string, id: string): Promise<TrainingPlan> => {
    await verifyPlanOwnership(id, userId);

    const source = await findOrThrow(
      prisma.trainingPlan.findUnique({
        where: { id },
        include: {
          weeks: {
            orderBy: { index: "asc" },
            include: {
              days: {
                orderBy: { dayOfWeek: "asc" },
                include: {
                  sessions: {
                    orderBy: { order: "asc" },
                    include: {
                      blocks: {
                        orderBy: { order: "asc" },
                        include: {
                          segments: {
                            orderBy: { order: "asc" },
                            include: {
                              setGroups: {
                                orderBy: { order: "asc" },
                                include: { entries: { orderBy: { order: "asc" } } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      "Training plan",
    );

    try {
      const plan = await prisma.$transaction(async (tx) => {
        const created = await tx.trainingPlan.create({
          data: {
            creatorId: userId,
            name: `Copy of ${source.name}`,
            description: source.description,
            status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.DRAFT],
            originalPlanId: source.id,
            licensable: source.licensable,
          },
        });

        await cloneWeeksIntoPlan(tx, created.id, source.weeks);

        return created;
      });

      return mapToTrainingPlan(plan);
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan", field: "name" });
    }
  },

  archive: async (userId: string, id: string): Promise<TrainingPlan> =>
    transitionPlanStatus(
      userId,
      id,
      TrainingPlanStatus.ACTIVE,
      TrainingPlanStatus.ARCHIVED,
      "Only active plans can be archived.",
    ),

  restore: async (userId: string, id: string): Promise<TrainingPlan> =>
    transitionPlanStatus(
      userId,
      id,
      TrainingPlanStatus.ARCHIVED,
      TrainingPlanStatus.ACTIVE,
      "Only archived plans can be restored.",
    ),

  activate: async (userId: string, id: string): Promise<TrainingPlan> =>
    transitionPlanStatus(
      userId,
      id,
      TrainingPlanStatus.DRAFT,
      TrainingPlanStatus.ACTIVE,
      "Only draft plans can be activated.",
    ),
};
