import {
  type CreateWorkoutBlockData,
  type UpdateWorkoutBlockData,
  type WorkoutBlock,
} from "@repo/contracts/workout-block";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToWorkoutBlock } from "../../mappers";

import { resolveCoachId, verifyBlockOwnership, verifyWorkoutOwnership } from "./guards";

const includeCategory = { category: true } as const;

export const platformWorkoutBlocksApi = {
  getAll: async (userId: string, workoutId: string): Promise<WorkoutBlock[]> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const blocks = await prisma.workoutBlock.findMany({
      where: { workoutId },
      include: includeCategory,
      orderBy: { sortOrder: "asc" },
    });

    return blocks.map(mapToWorkoutBlock);
  },

  getById: async (userId: string, workoutId: string, id: string): Promise<WorkoutBlock> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const block = await prisma.workoutBlock.findUnique({
      where: { id },
      include: includeCategory,
    });

    if (!block || block.workoutId !== workoutId) {
      throw new NotFoundError("Workout block not found", { id, workoutId });
    }

    return mapToWorkoutBlock(block);
  },

  create: async (
    userId: string,
    workoutId: string,
    data: CreateWorkoutBlockData,
  ): Promise<WorkoutBlock> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const block = await prisma.workoutBlock.create({
      data: { workoutId, ...data },
      include: includeCategory,
    });

    return mapToWorkoutBlock(block);
  },

  update: async (
    userId: string,
    workoutId: string,
    id: string,
    data: UpdateWorkoutBlockData,
  ): Promise<WorkoutBlock> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const existing = await prisma.workoutBlock.findUnique({
      where: { id },
      select: { workoutId: true },
    });

    if (!existing || existing.workoutId !== workoutId) {
      throw new NotFoundError("Workout block not found", { id, workoutId });
    }

    const block = await prisma.workoutBlock.update({
      where: { id },
      data,
      include: includeCategory,
    });

    return mapToWorkoutBlock(block);
  },

  delete: async (userId: string, workoutId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyWorkoutOwnership(workoutId, coachId);

    const existing = await prisma.workoutBlock.findUnique({
      where: { id },
      select: { workoutId: true },
    });

    if (!existing || existing.workoutId !== workoutId) {
      throw new NotFoundError("Workout block not found", { id, workoutId });
    }

    await prisma.workoutBlock.delete({ where: { id } });
  },

  reorderSets: async (userId: string, blockId: string, orderedIds: string[]): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyBlockOwnership(blockId, coachId);

    const sets = await prisma.prescribedSet.findMany({
      where: { blockId },
      select: { id: true },
    });

    const existingIds = new Set(sets.map((s) => s.id));

    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
      throw new BadRequestError("orderedIds must match all sets in the block");
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.prescribedSet.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  },
};
