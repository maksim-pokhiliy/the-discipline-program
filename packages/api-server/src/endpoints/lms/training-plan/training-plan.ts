import { type Prisma, type TrainingPlan as PrismaTrainingPlan } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  TrainingPlanStatus,
  type UpdateTrainingPlanData,
} from "@repo/contracts/lms/training-plan";
import { ConflictError, NotFoundError } from "@repo/errors";

import { verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import {
  mapToTrainingPlan,
  TRAINING_PLAN_STATUS_MAP,
  TRAINING_PLAN_STATUS_TO_PRISMA_MAP,
} from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { DEFAULT_LIST_LIMIT } from "../../../utils/list-limits";

const mapToListItem = (p: PrismaTrainingPlan): TrainingPlanListItem => mapToTrainingPlan(p);

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
    creatorId: userId,
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

  try {
    const result = await prisma.trainingPlan.updateMany({
      where: { id, status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[expectedCurrentStatus] },
      data: { status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[targetStatus] },
    });

    if (result.count === 0) {
      const current = await prisma.trainingPlan.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!current) {
        throw new NotFoundError("Training plan not found", { id });
      }

      throw new ConflictError(errorMessage, {
        id,
        currentStatus: TRAINING_PLAN_STATUS_MAP[current.status],
        expectedStatus: expectedCurrentStatus,
      });
    }

    const plan = await findOrThrow(
      prisma.trainingPlan.findUnique({ where: { id } }),
      "Training plan",
    );

    return mapToTrainingPlan(plan);
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
      throw error;
    }

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
        data: {
          creatorId: userId,
          name: data.name,
          ...(data.description !== undefined && { description: data.description }),
        },
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
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      return mapToTrainingPlan(plan);
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan", field: "name" });
    }
  },

  delete: async (userId: string, id: string): Promise<void> => {
    await verifyPlanOwnership(id, userId);

    try {
      await prisma.trainingPlan.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Training plan" });
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
