import { type Prisma, type Exercise as PrismaExercise } from "@prisma/client";

import { ExerciseStatus } from "@repo/contracts/library/exercise";

import { prisma } from "../../../db/client";
import { EXERCISE_STATUS_TO_PRISMA_MAP } from "../../../mappers/library";

export const normalizeExerciseName = (canonicalName: string): string =>
  canonicalName.trim().toLowerCase().replace(/\s+/g, " ");

export const findActiveApprovedDuplicate = async (
  normalizedName: string,
  excludeId?: string,
): Promise<PrismaExercise | null> => {
  const where: Prisma.ExerciseWhereInput = {
    normalizedName,
    status: EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED],
  };

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  return prisma.exercise.findFirst({ where });
};

export const buildCoachListWhere = (params: {
  userId: string;
  search?: string;
  includeOwnDrafts?: boolean;
  status?: ExerciseStatus;
}): Prisma.ExerciseWhereInput => {
  const { userId, search, includeOwnDrafts, status } = params;

  if (status) {
    return {
      deletedAt: null,
      status: EXERCISE_STATUS_TO_PRISMA_MAP[status],
      ...(search ? buildSearchFilter(search) : {}),
    };
  }

  const approved = EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.APPROVED];
  const pending = EXERCISE_STATUS_TO_PRISMA_MAP[ExerciseStatus.PENDING_REVIEW];

  const visibility: Prisma.ExerciseWhereInput = includeOwnDrafts
    ? {
        OR: [{ status: approved }, { status: pending, createdByUserId: userId }],
      }
    : { status: approved };

  return {
    deletedAt: null,
    AND: [visibility, ...(search ? [buildSearchFilter(search)] : [])],
  };
};

export const buildAdminListWhere = (params: {
  search?: string;
  status?: ExerciseStatus;
  createdByUserId?: string;
}): Prisma.ExerciseWhereInput => {
  const { search, status, createdByUserId } = params;

  const where: Prisma.ExerciseWhereInput = {
    deletedAt: null,
    ...(status ? { status: EXERCISE_STATUS_TO_PRISMA_MAP[status] } : {}),
    ...(createdByUserId ? { createdByUserId } : {}),
    ...(search ? buildSearchFilter(search) : {}),
  };

  return where;
};

export const computeUsageCounts = async (exerciseIds: string[]): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();

  if (exerciseIds.length === 0) {
    return counts;
  }

  const rows = await prisma.workoutBlockExercise.groupBy({
    by: ["exerciseId"],
    where: { exerciseId: { in: exerciseIds } },
    _count: { _all: true },
  });

  for (const row of rows) {
    counts.set(row.exerciseId, row._count._all);
  }

  return counts;
};

const buildSearchFilter = (search: string): Prisma.ExerciseWhereInput => {
  const trimmed = search.trim();

  if (!trimmed) {
    return {};
  }

  return {
    OR: [
      { canonicalName: { contains: trimmed, mode: "insensitive" } },
      { normalizedName: { contains: trimmed.toLowerCase(), mode: "insensitive" } },
      { aliases: { has: trimmed } },
    ],
  };
};
