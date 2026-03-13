import {
  type CalendarWorkout,
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  type TrainingPlanStatus,
  type UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToTrainingPlan, mapToWorkout } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

type PlanWithStats = Parameters<typeof mapToTrainingPlan>[0] & {
  _count: { enrollments: number };
  workouts: { scheduledDate: Date | null }[];
};

const getWeekBounds = (): { weekStart: Date; weekEnd: Date; todayStart: Date; todayEnd: Date } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(now);

  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);

  weekEnd.setDate(weekStart.getDate() + 7);

  const todayStart = new Date(now);

  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);

  todayEnd.setDate(todayStart.getDate() + 1);

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
        deletedAt: null,
        scheduledDate: { gte: weekStart, lt: weekEnd },
        plan: { coachId, deletedAt: null },
      },
      include: {
        plan: { select: { id: true, name: true, status: true } },
        _count: { select: { blocks: true } },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    });

    return workouts.map((w) => ({
      ...mapToWorkout(w),
      planName: w.plan.name,
      planStatus: w.plan.status as TrainingPlanStatus,
    }));
  },

  getAll: async (userId: string): Promise<TrainingPlan[]> => {
    const coachId = await resolveCoachId(userId);

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return plans.map(mapToTrainingPlan);
  },

  getPageData: async (userId: string): Promise<CoachPlansPageData> => {
    const coachId = await resolveCoachId(userId);
    const { weekStart, weekEnd, todayStart, todayEnd } = getWeekBounds();

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
        workouts: {
          where: {
            deletedAt: null,
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

    if (!plan || plan.deletedAt) {
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

    await prisma.trainingPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  duplicate: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const source = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      include: {
        workouts: {
          where: { deletedAt: null },
          include: {
            blocks: {
              include: {
                sets: true,
              },
            },
          },
        },
      },
    });

    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.trainingPlan.create({
        data: {
          coachId,
          name: `Copy of ${source.name}`,
          description: source.description,
          status: "DRAFT",
        },
      });

      for (const workout of source.workouts) {
        const newWorkout = await tx.workout.create({
          data: {
            planId: plan.id,
            scheduledDate: workout.scheduledDate,
            title: workout.title,
            description: workout.description,
          },
        });

        for (const block of workout.blocks) {
          const newBlock = await tx.workoutBlock.create({
            data: {
              workoutId: newWorkout.id,
              categoryId: block.categoryId,
              rounds: block.rounds,
              timeCapSec: block.timeCapSec,
            },
          });

          if (block.sets.length > 0) {
            await tx.prescribedSet.createMany({
              data: block.sets.map((s) => ({
                blockId: newBlock.id,
                exerciseId: s.exerciseId,
                sets: s.sets,
                reps: s.reps,
                weightValue: s.weightValue,
                weightUnit: s.weightUnit,
                rpe: s.rpe,
                notes: s.notes,
              })),
            });
          }
        }
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

    if (plan.status !== "ACTIVE") {
      throw new ConflictError("Only active plans can be archived.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: "ARCHIVED" },
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

    if (plan.status !== "ARCHIVED") {
      throw new ConflictError("Only archived plans can be restored.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: "ACTIVE" },
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

    if (plan.status !== "DRAFT") {
      throw new ConflictError("Only draft plans can be activated.");
    }

    const updated = await prisma.trainingPlan.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    return mapToTrainingPlan(updated);
  },
};
