import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import {
  type CalendarWorkout,
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  TrainingPlanStatus,
  type UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToTrainingPlan, mapToWorkout } from "../../mappers";
import { TRAINING_PLAN_STATUS_MAP } from "../../mappers/enum-maps";
import {
  MS_PER_DAY,
  endOfWeekInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

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

export const platformTrainingPlansApi = {
  getCalendarWeek: async (userId: string, weekStart: Date): Promise<CalendarWorkout[]> => {
    const coachId = await resolveCoachId(userId);

    const weekEnd = new Date(weekStart);

    weekEnd.setDate(weekEnd.getDate() + 7);

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
    const { timezone: tz } = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const { weekStart, weekEnd, todayStart, todayEnd } = getWeekBounds(tz);

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: PlanEnrollmentStatus.ACTIVE } },
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

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError("Training plan not found", { id });
    }

    if (plan.coachId !== coachId) {
      throw new ForbiddenError("Training plan does not belong to this coach");
    }

    return mapToTrainingPlan(plan);
  },

  create: async (userId: string, data: CreateTrainingPlanData): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    const plan = await prisma.trainingPlan.create({
      data: { coachId, ...data },
    });

    return mapToTrainingPlan(plan);
  },

  update: async (
    userId: string,
    id: string,
    data: UpdateTrainingPlanData,
  ): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.update({
      where: { id },
      data,
    });

    return mapToTrainingPlan(plan);
  },

  delete: async (userId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    await prisma.$transaction(async (tx) => {
      await tx.planEnrollment.deleteMany({ where: { trainingPlanId: id } });
      await tx.product.updateMany({
        where: { trainingPlanId: id },
        data: { trainingPlanId: null },
      });
      await tx.trainingPlan.delete({ where: { id } });
    });
  },

  duplicate: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const source = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      include: {
        workouts: true,
      },
    });

    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.trainingPlan.create({
        data: {
          coachId,
          name: `Copy of ${source.name}`,
          description: source.description,
          status: TrainingPlanStatus.DRAFT,
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
          })),
        });
      }

      return plan;
    });

    return mapToTrainingPlan(newPlan);
  },

  archive: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    if (plan.status !== TrainingPlanStatus.ACTIVE) {
      throw new ConflictError("Only active plans can be archived.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: TrainingPlanStatus.ARCHIVED },
    });

    return mapToTrainingPlan(updated);
  },

  restore: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    if (plan.status !== TrainingPlanStatus.ARCHIVED) {
      throw new ConflictError("Only archived plans can be restored.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: TrainingPlanStatus.ACTIVE },
    });

    return mapToTrainingPlan(updated);
  },

  activate: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    if (plan.status !== TrainingPlanStatus.DRAFT) {
      throw new ConflictError("Only draft plans can be activated.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: TrainingPlanStatus.ACTIVE },
    });

    return mapToTrainingPlan(updated);
  },
};
