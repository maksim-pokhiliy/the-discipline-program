import {
  type CoachPlansPageData,
  type CreateTrainingPlanData,
  type TrainingPlan,
  type TrainingPlanListItem,
  type UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToTrainingPlan } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

type PlanWithStats = Parameters<typeof mapToTrainingPlan>[0] & {
  _count: { workouts: number; enrollments: number; products: number };
  workouts: { logs: { date: Date }[] }[];
};

const mapToListItem = (p: PlanWithStats): TrainingPlanListItem => {
  const lastLog = p.workouts
    .flatMap((w) => w.logs)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  return {
    ...mapToTrainingPlan(p),
    workoutsCount: p._count.workouts,
    enrolledAthletesCount: p._count.enrollments,
    lastActivityAt: lastLog?.date ?? null,
    hasLinkedProducts: p._count.products > 0,
  };
};

export const platformTrainingPlansApi = {
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

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            workouts: { where: { deletedAt: null } },
            enrollments: { where: { status: "ACTIVE" } },
            products: { where: { deletedAt: null } },
          },
        },
        workouts: {
          where: { deletedAt: null },
          select: {
            logs: {
              select: { date: true },
              orderBy: { date: "desc" },
              take: 1,
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

    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      select: {
        status: true,
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    });

    if (plan.status === "ACTIVE") {
      throw new ConflictError("Cannot delete an active training plan. Archive it first.");
    }

    if (plan._count.enrollments > 0) {
      throw new ConflictError(
        `Cannot delete: ${plan._count.enrollments} athlete(s) have active enrollments.`,
      );
    }

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
            dayOrder: workout.dayOrder,
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
