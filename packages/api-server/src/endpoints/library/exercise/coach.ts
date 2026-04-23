import { type Prisma } from "@prisma/client";

import {
  type CreateExerciseData,
  type Exercise,
  type ExerciseListItem,
  ExerciseStatus,
  type UpdateExerciseData,
} from "@repo/contracts/library/exercise";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import {
  EXERCISE_STATUS_TO_PRISMA_MAP,
  MEASUREMENT_UNIT_TO_PRISMA_MAP,
  mapToExercise,
} from "../../../mappers/library";
import { findOrThrow, handlePrismaError } from "../../../utils";

import {
  buildCoachListWhere,
  computeUsageCounts,
  findActiveApprovedDuplicate,
  normalizeExerciseName,
} from "./shared";

const toCreateInput = (
  userId: string,
  data: CreateExerciseData,
  normalizedName: string,
): Prisma.ExerciseUncheckedCreateInput => ({
  canonicalName: data.canonicalName,
  normalizedName,
  aliases: data.aliases,
  description: data.description ?? null,
  videoUrl: data.videoUrl ?? null,
  measurementUnits: data.measurementUnits.map((unit) => MEASUREMENT_UNIT_TO_PRISMA_MAP[unit]),
  hasLoad: data.hasLoad,
  status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW],
  createdByUserId: userId,
});

const toUpdateData = (
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

export const libraryExerciseCoachApi = {
  list: async (params: {
    userId: string;
    search?: string;
    includeOwnDrafts?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: ExerciseListItem[]; total: number; page: number; limit: number }> => {
    const { userId, search, includeOwnDrafts, page = 1, limit = 50 } = params;

    const where = buildCoachListWhere({ userId, search, includeOwnDrafts });
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ canonicalName: "asc" }],
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

  listMine: async (params: {
    userId: string;
    statusFilter?: ExerciseStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ExerciseListItem[]; total: number; page: number; limit: number }> => {
    const { userId, statusFilter, search, page = 1, limit = 50 } = params;
    const trimmedSearch = search?.trim();

    const where: Prisma.ExerciseWhereInput = {
      createdByUserId: userId,
      deletedAt: null,
      ...(statusFilter ? { status: EXERCISE_STATUS_TO_PRISMA_MAP[statusFilter] } : {}),
      ...(trimmedSearch
        ? {
            OR: [
              { canonicalName: { contains: trimmedSearch, mode: "insensitive" } },
              { normalizedName: { contains: trimmedSearch.toLowerCase(), mode: "insensitive" } },
              { aliases: { has: trimmedSearch } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
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

  getById: async (params: { userId: string; id: string }): Promise<Exercise> => {
    const { userId, id } = params;

    const row = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    const isOwner = row.createdByUserId === userId;
    const isApproved = row.status === EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED];

    if (!isApproved && !isOwner) {
      throw new ForbiddenError("Exercise not visible to this coach", { id });
    }

    return mapToExercise(row);
  },

  create: async (params: { userId: string; input: CreateExerciseData }): Promise<Exercise> => {
    const { userId, input } = params;
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
        data: toCreateInput(userId, input, normalizedName),
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "canonicalName" });
    }
  },

  update: async (params: {
    userId: string;
    id: string;
    input: UpdateExerciseData;
  }): Promise<Exercise> => {
    const { userId, id, input } = params;

    const existing = await findOrThrow(prisma.exercise.findUnique({ where: { id } }), "Exercise");

    if (existing.createdByUserId !== userId) {
      throw new ForbiddenError("Exercise does not belong to this coach", { id });
    }

    if (existing.status !== EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW]) {
      throw new ConflictError("Only pending-review exercises can be edited by the author", {
        id,
        status: existing.status,
      });
    }

    const normalizedName =
      input.canonicalName !== undefined ? normalizeExerciseName(input.canonicalName) : null;

    if (normalizedName !== null) {
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
        data: toUpdateData(input, normalizedName),
      });

      return mapToExercise(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise", field: "canonicalName" });
    }
  },

  delete: async (params: { userId: string; id: string }): Promise<void> => {
    const { userId, id } = params;

    const existing = await prisma.exercise.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Exercise not found", { id });
    }

    if (existing.createdByUserId !== userId) {
      throw new ForbiddenError("Exercise does not belong to this coach", { id });
    }

    if (existing.status !== EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW]) {
      throw new ConflictError("Only pending-review exercises can be deleted by the author", {
        id,
        status: existing.status,
      });
    }

    try {
      await prisma.exercise.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise" });
    }
  },
};
