import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateExerciseLibraryItemInput } from "@repo/contracts/lms/exercise-library-item";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { mapToExerciseLibraryItem } from "../../mappers/lms";
import {
  BODY_PART_TO_PRISMA_MAP,
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  MODALITY_TO_PRISMA_MAP,
  MOVEMENT_PATTERN_TO_PRISMA_MAP,
  SKILL_LEVEL_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.ADMIN,
  UserRole.HEAD_COACH,
  UserRole.COACH,
]);

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const updateExerciseLibraryItemImpl = async (
  userId: string,
  exerciseLibraryItemId: string,
  data: UpdateExerciseLibraryItemInput,
) => {
  const role = await requireCoachLikeRole(userId);
  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  const existing = await findOrThrow(
    prisma.exerciseLibraryItem.findUnique({ where: { id: exerciseLibraryItemId } }),
    "Exercise library item",
  );

  if (!isPrivileged) {
    if (existing.scope === "SYSTEM") {
      throw new ForbiddenError("SYSTEM exercise items are read-only for coaches");
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenError("Exercise library item belongs to another coach");
    }

    if (data.scope !== undefined || data.ownerId !== undefined) {
      throw new ForbiddenError("Only ADMIN or HEAD_COACH can change scope or ownerId");
    }
  }

  const wantsScopeChange =
    data.scope !== undefined && LIBRARY_SCOPE_TO_PRISMA_MAP[data.scope] !== existing.scope;
  const wantsOwnerChange = data.ownerId !== undefined && data.ownerId !== existing.ownerId;
  const targetScope = data.scope ?? (existing.scope === "SYSTEM" ? "SYSTEM" : "COACH");

  let resolvedOwnerId: string | null = existing.ownerId;

  if (isPrivileged && (wantsScopeChange || wantsOwnerChange)) {
    if (targetScope === "SYSTEM") {
      resolvedOwnerId = null;

      const collision = await prisma.exerciseLibraryItem.findFirst({
        where: { scope: "SYSTEM", name: existing.name, id: { not: exerciseLibraryItemId } },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError("SYSTEM library already contains an item with this name");
      }
    } else {
      const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

      if (!newOwnerId) {
        throw new BadRequestError("COACH-scoped item requires ownerId");
      }

      const owner = await prisma.user.findUnique({
        where: { id: newOwnerId },
        select: { role: true },
      });

      if (!owner) {
        throw new NotFoundError("Owner user not found", { ownerId: newOwnerId });
      }

      if (!ADMIN_OR_COACH_LIKE.has(ROLE_MAP[owner.role])) {
        throw new BadRequestError("Owner must be a coach-like user");
      }

      const collision = await prisma.exerciseLibraryItem.findFirst({
        where: {
          scope: "COACH",
          ownerId: newOwnerId,
          name: existing.name,
          id: { not: exerciseLibraryItemId },
        },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError("Owner already has an exercise with this name");
      }

      resolvedOwnerId = newOwnerId;
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
              secondaryBodyParts: data.secondaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]),
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
        ...(isPrivileged && wantsScopeChange
          ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[targetScope] }
          : {}),
        ...(isPrivileged && (wantsScopeChange || wantsOwnerChange)
          ? { ownerId: resolvedOwnerId }
          : {}),
      },
    });

    return mapToExerciseLibraryItem(item);
  } catch (error) {
    return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
  }
};
