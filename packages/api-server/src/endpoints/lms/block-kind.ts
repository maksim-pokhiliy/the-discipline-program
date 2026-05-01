import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteBlockKindInput,
  type ListBlockKindsQuery,
} from "@repo/contracts/lms/block-kind";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToBlockKind } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { createBlockKindImpl } from "./block-kind-create";
import { updateBlockKindImpl } from "./block-kind-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (role: UserRole, userId: string): Prisma.BlockKindWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsBlockKindApi = {
  list: async (userId: string, query: ListBlockKindsQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.BlockKindWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.blockKind.findMany({
      where,
      orderBy: { name: "asc" },
      take: query.take,
    });

    return { items: items.map(mapToBlockKind), total: items.length };
  },

  getById: async (userId: string, blockKindId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.blockKind.findUnique({ where: { id: blockKindId } }),
      "Block kind",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Block kind not found", { blockKindId });
    }

    return mapToBlockKind(item);
  },

  create: createBlockKindImpl,

  update: updateBlockKindImpl,

  delete: async (userId: string, blockKindId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.blockKind.findUnique({ where: { id: blockKindId } }),
      "Block kind",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM block kinds are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Block kind belongs to another coach");
      }
    }

    try {
      await prisma.blockKind.update({
        where: { id: blockKindId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block kind" });
    }
  },

  promote: async (userId: string, blockKindId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.blockKind.findUnique({ where: { id: blockKindId } }),
      "Block kind",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Block kind is already SYSTEM-scoped", { blockKindId });
    }

    const collision = await prisma.blockKind.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: blockKindId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("SYSTEM library already contains a block kind with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.blockKind.updateMany({
        where: { id: blockKindId, version: existing.version },
        data: { scope: "SYSTEM", ownerId: null, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", { blockKindId });
      }

      const promoted = await findOrThrow(
        prisma.blockKind.findUnique({ where: { id: blockKindId } }),
        "Block kind",
      );

      logger.info("lms.library.block_kind.promoted", {
        actingUserId: userId,
        blockKindId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToBlockKind(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block kind", field: "name" });
    }
  },

  demote: async (userId: string, blockKindId: string, data: DemoteBlockKindInput) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.blockKind.findUnique({ where: { id: blockKindId } }),
      "Block kind",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Block kind is already COACH-scoped", { blockKindId });
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

    const collision = await prisma.blockKind.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: blockKindId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has a block kind with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.blockKind.updateMany({
        where: { id: blockKindId, version: existing.version },
        data: { scope: "COACH", ownerId: data.newOwnerId, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", { blockKindId });
      }

      const demoted = await findOrThrow(
        prisma.blockKind.findUnique({ where: { id: blockKindId } }),
        "Block kind",
      );

      logger.info("lms.library.block_kind.demoted", {
        actingUserId: userId,
        blockKindId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToBlockKind(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block kind", field: "name" });
    }
  },
};
