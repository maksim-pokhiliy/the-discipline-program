import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreateExerciseLibraryItemInput,
  type DemoteExerciseLibraryItemInput,
  type ListExerciseLibraryItemsQuery,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  BODY_PART_TO_PRISMA_MAP,
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  mapToExerciseLibraryItem,
  MODALITY_TO_PRISMA_MAP,
  MOVEMENT_PATTERN_TO_PRISMA_MAP,
  SKILL_LEVEL_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

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
      take: query.take,
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

  create: async (userId: string, data: CreateExerciseLibraryItemInput) => {
    const role = await requireCoachLikeRole(userId);

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;
    const scope = data.scope;
    const ownerId = scope === "SYSTEM" ? null : userId;

    if (scope === "SYSTEM" && !isAdminPath) {
      throw new ForbiddenError("Only admin or head_coach can create SYSTEM exercise items");
    }

    try {
      const item = await prisma.exerciseLibraryItem.create({
        data: {
          scope: LIBRARY_SCOPE_TO_PRISMA_MAP[scope],
          ownerId,
          name: data.name,
          nameAliases: data.nameAliases,
          description: data.description ?? null,
          primaryMovement: MOVEMENT_PATTERN_TO_PRISMA_MAP[data.primaryMovement],
          modality: MODALITY_TO_PRISMA_MAP[data.modality],
          equipment: data.equipment,
          primaryBodyParts: data.primaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]),
          secondaryBodyParts: data.secondaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]),
          skillLevel: SKILL_LEVEL_TO_PRISMA_MAP[data.skillLevel],
          defaultMetrics: toJsonInput(data.defaultMetrics),
          demoVideoUrl: data.demoVideoUrl ?? null,
          demoImageUrl: data.demoImageUrl ?? null,
          parentId: data.parentId ?? null,
          isBenchmark: data.isBenchmark,
        },
      });

      return mapToExerciseLibraryItem(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
    }
  },

  update: async (
    userId: string,
    exerciseLibraryItemId: string,
    data: UpdateExerciseLibraryItemInput,
  ) => {
    if ((data as Record<string, unknown>)["scope"] !== undefined) {
      throw new ForbiddenError("scope cannot be changed via update; use promote or demote");
    }

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
      const item = await prisma.exerciseLibraryItem.update({
        where: { id: exerciseLibraryItemId },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.nameAliases ? { nameAliases: data.nameAliases } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.primaryMovement
            ? { primaryMovement: MOVEMENT_PATTERN_TO_PRISMA_MAP[data.primaryMovement] }
            : {}),
          ...(data.modality ? { modality: MODALITY_TO_PRISMA_MAP[data.modality] } : {}),
          ...(data.equipment ? { equipment: data.equipment } : {}),
          ...(data.primaryBodyParts
            ? { primaryBodyParts: data.primaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]) }
            : {}),
          ...(data.secondaryBodyParts
            ? {
                secondaryBodyParts: data.secondaryBodyParts.map(
                  (bp) => BODY_PART_TO_PRISMA_MAP[bp],
                ),
              }
            : {}),
          ...(data.skillLevel ? { skillLevel: SKILL_LEVEL_TO_PRISMA_MAP[data.skillLevel] } : {}),
          ...(data.defaultMetrics !== undefined
            ? { defaultMetrics: toJsonInput(data.defaultMetrics) }
            : {}),
          ...(data.demoVideoUrl !== undefined ? { demoVideoUrl: data.demoVideoUrl } : {}),
          ...(data.demoImageUrl !== undefined ? { demoImageUrl: data.demoImageUrl } : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
          ...(data.isBenchmark !== undefined ? { isBenchmark: data.isBenchmark } : {}),
          ...(data.isDeprecated !== undefined ? { isDeprecated: data.isDeprecated } : {}),
          ...(data.supersedesId !== undefined ? { supersedesId: data.supersedesId } : {}),
        },
      });

      return mapToExerciseLibraryItem(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
    }
  },

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
      const promoted = await prisma.exerciseLibraryItem.update({
        where: { id: exerciseLibraryItemId },
        data: { scope: "SYSTEM", ownerId: null },
      });

      logger.info("lms.library.exercise.promoted", {
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
      const demoted = await prisma.exerciseLibraryItem.update({
        where: { id: exerciseLibraryItemId },
        data: { scope: "COACH", ownerId: data.newOwnerId },
      });

      logger.info("lms.library.exercise.demoted", {
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
