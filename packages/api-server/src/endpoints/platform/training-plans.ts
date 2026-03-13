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
  enrollments: { userId: string }[];
  workouts: { logs: { userId: string }[] }[];
};

const getWeekBounds = (): { start: Date; end: Date } => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(now);

  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  end.setDate(start.getDate() + 7);

  return { start, end };
};

const mapToListItem = (p: PlanWithStats): TrainingPlanListItem => {
  const enrolledCount = p._count.enrollments;

  let weeklyComplianceRate: number | null = null;

  if (enrolledCount > 0) {
    const activeUserIds = new Set(p.enrollments.map((e) => e.userId));
    const usersWithLogs = new Set(
      p.workouts.flatMap((w) => w.logs.map((l) => l.userId)).filter((id) => activeUserIds.has(id)),
    );

    weeklyComplianceRate = Math.round((usersWithLogs.size / activeUserIds.size) * 100);
  }

  return {
    ...mapToTrainingPlan(p),
    enrolledAthletesCount: enrolledCount,
    weeklyComplianceRate,
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
      planId: w.plan.id,
      planName: w.plan.name,
      planStatus: w.plan.status as TrainingPlanStatus,
      blockCount: w._count.blocks,
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
    const { start, end } = getWeekBounds();

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          select: { userId: true },
        },
        workouts: {
          where: { deletedAt: null },
          select: {
            logs: {
              where: { date: { gte: start, lt: end } },
              select: { userId: true },
            },
          },
        },
      },
    });

    return { plans: plans.map(mapToListItem) };
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
