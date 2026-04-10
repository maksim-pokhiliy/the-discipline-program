import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import {
  type CalendarWorkout,
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  TrainingPlanStatus,
  type UpdateTrainingPlanData,
} from "@repo/contracts/lms/training-plan";
import { ConflictError, NotFoundError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToTrainingPlan, mapToWorkout } from "../../mappers";
import {
  PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP,
  TRAINING_PLAN_STATUS_MAP,
  TRAINING_PLAN_STATUS_TO_PRISMA_MAP,
} from "../../mappers/enum-maps";
import { findOrThrow, handlePrismaError } from "../../utils";
import {
  DAYS_IN_WEEK,
  MS_PER_DAY,
  endOfWeekInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

type PlanWithStats = Parameters<typeof mapToTrainingPlan>[0] & {
  _count: { enrollments: number };
  workouts: { scheduledDate: Date | null }[];
};

const getWeekBounds = (tz: string) => {
  const todayStart = startOfTodayInTz(tz);
  const todayEnd = new Date(todayStart.getTime() + MS_PER_DAY);
  const weekStart = startOfWeekInTz(todayStart, tz);
  const weekEnd = new Date(endOfWeekInTz(todayStart, tz).getTime() + MS_PER_DAY);

  return { weekStart, weekEnd, todayStart, todayEnd };
};

const mapToListItem = (
  p: PlanWithStats,
  todayStart: Date,
  todayEnd: Date,
): TrainingPlanListItem => {
  const todayWorkouts = p.workouts.filter(
    (w) => w.scheduledDate && w.scheduledDate >= todayStart && w.scheduledDate < todayEnd,
  );

  return {
    ...mapToTrainingPlan(p),
    enrolledAthletesCount: p._count.enrollments,
    workoutsToday: todayWorkouts.length,
    workoutsThisWeek: p.workouts.length,
  };
};

const transitionPlanStatus = async (
  userId: string,
  id: string,
  expectedCurrentStatus: TrainingPlanStatus,
  targetStatus: TrainingPlanStatus,
  errorMessage: string,
): Promise<TrainingPlan> => {
  const coachId = await resolveCoachId(userId);

  await verifyPlanOwnership(id, coachId);

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
  getCalendarWeek: async (userId: string, weekStart: Date): Promise<CalendarWorkout[]> => {
    const coachId = await resolveCoachId(userId);
    const weekEnd = new Date(weekStart.getTime() + DAYS_IN_WEEK * MS_PER_DAY);

    const workouts = await prisma.workout.findMany({
      where: {
        scheduledDate: { gte: weekStart, lt: weekEnd },
        plan: { coachId },
      },
      include: {
        plan: { select: { id: true, name: true, status: true } },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    });

    return workouts.map((w) => ({
      ...mapToWorkout(w),
      planName: w.plan.name,
      planStatus: TRAINING_PLAN_STATUS_MAP[w.plan.status],
    }));
  },

  getAll: async (userId: string): Promise<TrainingPlan[]> => {
    const coachId = await resolveCoachId(userId);

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
    });

    return plans.map(mapToTrainingPlan);
  },

  getPageData: async (userId: string): Promise<CoachPlansPageData> => {
    const coachId = await resolveCoachId(userId);
    const { timezone: tz } = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      "User",
    );
    const { weekStart, weekEnd, todayStart, todayEnd } = getWeekBounds(tz);

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
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
        workouts: {
          where: {
            scheduledDate: { gte: weekStart, lt: weekEnd },
          },
          select: { scheduledDate: true },
        },
      },
    });

    return { plans: plans.map((p) => mapToListItem(p, todayStart, todayEnd)) };
  },

  getById: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError("Training plan not found", { id });
    }

    return mapToTrainingPlan(plan);
  },

  create: async (userId: string, data: CreateTrainingPlanData): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    try {
      const plan = await prisma.trainingPlan.create({
        data: { coachId, ...data },
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
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

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
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.planEnrollment.deleteMany({ where: { trainingPlanId: id } });
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
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const source = await findOrThrow(
      prisma.trainingPlan.findUnique({ where: { id }, include: { workouts: true } }),
      "Training plan",
    );

    try {
      const newPlan = await prisma.$transaction(async (tx) => {
        const plan = await tx.trainingPlan.create({
          data: {
            coachId,
            name: `Copy of ${source.name}`,
            description: source.description,
            status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.DRAFT],
          },
        });

        if (source.workouts.length > 0) {
          await tx.workout.createMany({
            data: source.workouts.map((workout) => ({
              planId: plan.id,
              scheduledDate: workout.scheduledDate,
              title: workout.title,
              description: workout.description,
              content: workout.content,
              sortOrder: workout.sortOrder,
            })),
          });
        }

        return plan;
      });

      return mapToTrainingPlan(newPlan);
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
