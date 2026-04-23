import { type Prisma } from "@prisma/client";

import {
  type CreateExerciseData,
  type Exercise,
  type ExerciseListItem,
  ExerciseStatus,
  type MergeExerciseData,
  type RejectExerciseData,
  type UpdateExerciseData,
} from "@repo/contracts/library/exercise";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import {
  EXERCISE_STATUS_TO_PRISMA_MAP,
  MEASUREMENT_UNIT_TO_PRISMA_MAP,
  mapToExercise,
} from "../../../mappers/library";
import { findOrThrow, handlePrismaError } from "../../../utils";

import {
  buildAdminListWhere,
  computeUsageCounts,
  findActiveApprovedDuplicate,
  normalizeExerciseName,
} from "./shared";

const toAdminCreateInput = (
  data: CreateExerciseData,
  normalizedName: string,
  actorId: string,
): Prisma.ExerciseUncheckedCreateInput => ({
  canonicalName: data.canonicalName,
  normalizedName,
  aliases: data.aliases,
  description: data.description ?? null,
  videoUrl: data.videoUrl ?? null,
  measurementUnits: data.measurementUnits.map((unit) => MEASUREMENT_UNIT_TO_PRISMA_MAP[unit]),
  hasLoad: data.hasLoad,
  status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED],
  createdByUserId: actorId,
  reviewedByUserId: actorId,
  reviewedAt: new Date(),
});

const toAdminUpdateData = (
  data: UpdateExerciseData,
  normalizedName: string | null,
): Prisma.ExerciseUncheckedUpdateInput => {
  const update: Prisma.ExerciseUncheckedUpdateInput = {};

  if (data.canonicalName !== undefined) {
    update.canonicalName = data.canonicalName;
  }

  if (normalizedName !== null) {
    update.normalizedName = normalizedName;
  }

  if (data.aliases !== undefined) {
    update.aliases = data.aliases;
  }

  if (data.description !== undefined) {
    update.description = data.description ?? null;
  }

  if (data.videoUrl !== undefined) {
    update.videoUrl = data.videoUrl ?? null;
  }

  if (data.measurementUnits !== undefined) {
    update.measurementUnits = data.measurementUnits.map(
      (unit) => MEASUREMENT_UNIT_TO_PRISMA_MAP[unit],
    );
  }

  if (data.hasLoad !== undefined) {
    update.hasLoad = data.hasLoad;
  }

  return update;
};

export const libraryExerciseAdminApi = {
  list: async (params: {
    search?: string;
    status?: ExerciseStatus;
    createdByUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ExerciseListItem[]; total: number; page: number; limit: number }> => {
    const { search, status, createdByUserId, page = 1, limit = 50 } = params;

    const where = buildAdminListWhere({ search, status, createdByUserId });
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { canonicalName: "asc" }],
        skip,
        take: limit,
      }),
      prisma.exercise.count({ where }),
    ]);

    const exercises = rows.map(mapToExercise);
    const counts = await computeUsageCounts(exercises.map((exercise) => exercise.id));

    return {
      items: exercises.map((exercise) => ({
        ...exercise,
        usageCount: counts.get(exercise.id) ?? 0,
      })),
      total,
      page,
      limit,
    };
  },

  getById: async (id: string): Promise<Exercise> => {
    const row = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    return mapToExercise(row);
  },

  create: async (params: { actorUserId: string; input: CreateExerciseData }): Promise<Exercise> => {
    const { actorUserId, input } = params;
    const normalizedName = normalizeExerciseName(input.canonicalName);

    const duplicate = await findActiveApprovedDuplicate(normalizedName);

    if (duplicate) {
      throw new ConflictError(
        `An approved exercise with the name "${duplicate.canonicalName}" already exists`,
        { duplicateOf: duplicate.id, normalizedName },
      );
    }

    try {
      const row = await prisma.exercise.create({
        data: toAdminCreateInput(input, normalizedName, actorUserId),
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "canonicalName" });
    }
  },

  update: async (params: { id: string; input: UpdateExerciseData }): Promise<Exercise> => {
    const { id, input } = params;

    const existing = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    const normalizedName =
      input.canonicalName !== undefined ? normalizeExerciseName(input.canonicalName) : null;

    if (
      normalizedName !== null &&
      existing.status === EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED]
    ) {
      const duplicate = await findActiveApprovedDuplicate(normalizedName, id);

      if (duplicate) {
        throw new ConflictError(
          `An approved exercise with the name "${duplicate.canonicalName}" already exists`,
          { duplicateOf: duplicate.id, normalizedName },
        );
      }
    }

    try {
      const row = await prisma.exercise.update({
        where: { id },
        data: toAdminUpdateData(input, normalizedName),
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "canonicalName" });
    }
  },

  delete: async (id: string): Promise<void> => {
    await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    try {
      await prisma.exercise.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  approve: async (params: { id: string; reviewerUserId: string }): Promise<Exercise> => {
    const { id, reviewerUserId } = params;

    const existing = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    if (existing.status !== EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW]) {
      throw new ConflictError("Only pending-review exercises can be approved", {
        id,
        status: existing.status,
      });
    }

    const duplicate = await findActiveApprovedDuplicate(existing.normalizedName, id);

    if (duplicate) {
      throw new ConflictError(
        `An approved exercise with the name "${duplicate.canonicalName}" already exists — merge instead`,
        { duplicateOf: duplicate.id, normalizedName: existing.normalizedName },
      );
    }

    try {
      const row = await prisma.exercise.update({
        where: { id },
        data: {
          status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED],
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: null,
        },
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  reject: async (params: {
    id: string;
    reviewerUserId: string;
    input: RejectExerciseData;
  }): Promise<Exercise> => {
    const { id, reviewerUserId, input } = params;

    const existing = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    if (existing.status !== EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW]) {
      throw new ConflictError("Only pending-review exercises can be rejected", {
        id,
        status: existing.status,
      });
    }

    try {
      const row = await prisma.exercise.update({
        where: { id },
        data: {
          status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.REJECTED],
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
        },
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },

  merge: async (params: {
    sourceId: string;
    input: MergeExerciseData;
    reviewerUserId: string;
  }): Promise<Exercise> => {
    const { sourceId, input, reviewerUserId } = params;
    const targetId = input.targetExerciseId;

    if (sourceId === targetId) {
      throw new ConflictError("Cannot merge exercise into itself", { sourceId, targetId });
    }

    const [source, target] = await Promise.all([
      findOrThrow(prisma.exercise.findUnique({ where: { id: sourceId } }), "Exercise"),
      findOrThrow(prisma.exercise.findUnique({ where: { id: targetId } }), "Exercise"),
    ]);

    if (target.status !== EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED]) {
      throw new ConflictError("Merge target must be APPROVED", { targetId, status: target.status });
    }

    if (
      source.status === EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.MERGED] ||
      source.status === EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.REJECTED]
    ) {
      throw new ConflictError("Source exercise cannot be merged", {
        sourceId,
        status: source.status,
      });
    }

    const now = new Date();

    try {
      const merged = await prisma.$transaction(async (tx) => {
        await tx.workoutBlockExercise.updateMany({
          where: { exerciseId: sourceId },
          data: { exerciseId: targetId },
        });

        await tx.exercise.update({
          where: { id: sourceId },
          data: {
            status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.MERGED],
            mergedIntoId: targetId,
            reviewedByUserId: reviewerUserId,
            reviewedAt: now,
            deletedAt: now,
          },
        });

        return tx.exercise.findUniqueOrThrow({ where: { id: targetId } });
      });

      return mapToExercise(merged);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },
};
