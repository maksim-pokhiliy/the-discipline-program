import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteExerciseLibraryItemInput,
  type ListExerciseLibraryItemsQuery,
} from "@repo/contracts/lms/exercise-library-item";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  mapToExerciseLibraryItem,
  MODALITY_TO_PRISMA_MAP,
  MOVEMENT_PATTERN_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { createExerciseLibraryItemImpl } from "./exercise-library-item-create";
import { updateExerciseLibraryItemImpl } from "./exercise-library-item-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (
  role: UserRole,
  userId: string,
): Prisma.ExerciseLibraryItemWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsExerciseLibraryItemApi = {
  list: async (userId: string, query: ListExerciseLibraryItemsQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.ExerciseLibraryItemWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.primaryMovement
        ? { primaryMovement: MOVEMENT_PATTERN_TO_PRISMA_MAP[query.primaryMovement] }
        : {}),
      ...(query.modality ? { modality: MODALITY_TO_PRISMA_MAP[query.modality] } : {}),
      ...(query.isBenchmark !== undefined ? { isBenchmark: query.isBenchmark } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { nameAliases: { has: query.search } },
            ],
          }
        : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.exerciseLibraryItem.findMany({
      where,
      orderBy: { name: "asc" },
      ...(query.take !== undefined && { take: query.take }),
    });

    return { items: items.map(mapToExerciseLibraryItem), total: items.length };
  },

  getById: async (userId: string, exerciseLibraryItemId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
      "Exercise library item",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Exercise library item not found", { exerciseLibraryItemId });
    }

    return mapToExerciseLibraryItem(item);
  },

  create: createExerciseLibraryItemImpl,

  update: updateExerciseLibraryItemImpl,

  delete: async (userId: string, exerciseLibraryItemId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
      "Exercise library item",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM exercise items are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Exercise library item belongs to another coach");
      }
    }

    try {
      await prisma.exerciseLibraryItem.update({
        where: { id: exerciseLibraryItemId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise library item" });
    }
  },

  promote: async (userId: string, exerciseLibraryItemId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
      "Exercise library item",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Exercise library item is already SYSTEM-scoped", {
        exerciseLibraryItemId,
      });
    }

    const collision = await prisma.exerciseLibraryItem.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: exerciseLibraryItemId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("SYSTEM library already contains an item with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.exerciseLibraryItem.updateMany({
        where: { id: exerciseLibraryItemId, version: existing.version },
        data: { scope: "SYSTEM", ownerId: null, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          exerciseLibraryItemId,
        });
      }

      const promoted = await findOrThrow(
        prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
        "Exercise library item",
      );

      logger.info("lms.library.exercise.promoted", {
        actingUserId: userId,
        exerciseLibraryItemId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToExerciseLibraryItem(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
    }
  },

  demote: async (
    userId: string,
    exerciseLibraryItemId: string,
    data: DemoteExerciseLibraryItemInput,
  ) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
      "Exercise library item",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Exercise library item is already COACH-scoped", {
        exerciseLibraryItemId,
      });
    }

    const newOwner = await prisma.user.findUnique({
      where: { id: data.newOwnerId },
      select: { role: true },
    });

    if (!newOwner) {
      throw new NotFoundError("New owner user not found", { newOwnerId: data.newOwnerId });
    }

    if (!ADMIN_OR_COACH_LIKE.has(ROLE_MAP[newOwner.role])) {
      throw new BadRequestError("New owner must be a coach-like user", {
        newOwnerId: data.newOwnerId,
      });
    }

    const collision = await prisma.exerciseLibraryItem.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: exerciseLibraryItemId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has an exercise with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.exerciseLibraryItem.updateMany({
        where: { id: exerciseLibraryItemId, version: existing.version },
        data: { scope: "COACH", ownerId: data.newOwnerId, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          exerciseLibraryItemId,
        });
      }

      const demoted = await findOrThrow(
        prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
        "Exercise library item",
      );

      logger.info("lms.library.exercise.demoted", {
        actingUserId: userId,
        exerciseLibraryItemId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToExerciseLibraryItem(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
    }
  },
};
