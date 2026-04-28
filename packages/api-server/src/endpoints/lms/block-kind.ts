import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreateBlockKindInput,
  type DemoteBlockKindInput,
  type ListBlockKindsQuery,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  mapToBlockKind,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

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

  create: async (userId: string, data: CreateBlockKindInput) => {
    const role = await requireCoachLikeRole(userId);

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;
    const scope = data.scope;
    const ownerId = scope === "SYSTEM" ? null : userId;

    if (scope === "SYSTEM" && !isAdminPath) {
      throw new ForbiddenError("Only admin or head_coach can create SYSTEM block kinds");
    }

    try {
      const item = await prisma.blockKind.create({
        data: {
          scope: LIBRARY_SCOPE_TO_PRISMA_MAP[scope],
          ownerId,
          name: data.name,
          description: data.description ?? null,
          iconKey: data.iconKey ?? null,
          defaultWeight: data.defaultWeight,
          defaultArchetypeKind: data.defaultArchetypeKind
            ? SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.defaultArchetypeKind]
            : null,
          analyticsCategory: data.analyticsCategory ?? null,
        },
      });

      return mapToBlockKind(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block kind", field: "name" });
    }
  },

  update: async (userId: string, blockKindId: string, data: UpdateBlockKindInput) => {
    const role = await requireCoachLikeRole(userId);
    const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    const existing = await findOrThrow(
      prisma.blockKind.findUnique({ where: { id: blockKindId } }),
      "Block kind",
    );

    if (!isPrivileged) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM block kinds are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Block kind belongs to another coach");
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

        const collision = await prisma.blockKind.findFirst({
          where: { scope: "SYSTEM", name: existing.name, id: { not: blockKindId } },
          select: { id: true },
        });

        if (collision) {
          throw new BadRequestError("SYSTEM library already contains a block kind with this name");
        }
      } else {
        const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

        if (!newOwnerId) {
          throw new BadRequestError("COACH-scoped block kind requires ownerId");
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

        const collision = await prisma.blockKind.findFirst({
          where: {
            scope: "COACH",
            ownerId: newOwnerId,
            name: existing.name,
            id: { not: blockKindId },
          },
          select: { id: true },
        });

        if (collision) {
          throw new BadRequestError("Owner already has a block kind with this name");
        }

        resolvedOwnerId = newOwnerId;
      }
    }

    try {
      const item = await prisma.blockKind.update({
        where: { id: blockKindId },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
          ...(data.defaultWeight !== undefined ? { defaultWeight: data.defaultWeight } : {}),
          ...(data.defaultArchetypeKind !== undefined
            ? {
                defaultArchetypeKind: data.defaultArchetypeKind
                  ? SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.defaultArchetypeKind]
                  : null,
              }
            : {}),
          ...(data.analyticsCategory !== undefined
            ? { analyticsCategory: data.analyticsCategory }
            : {}),
          ...(isPrivileged && wantsScopeChange
            ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[targetScope] }
            : {}),
          ...(isPrivileged && (wantsScopeChange || wantsOwnerChange)
            ? { ownerId: resolvedOwnerId }
            : {}),
        },
      });

      return mapToBlockKind(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block kind", field: "name" });
    }
  },

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
      const promoted = await prisma.blockKind.update({
        where: { id: blockKindId },
        data: { scope: "SYSTEM", ownerId: null },
      });

      logger.info("lms.library.block_kind.promoted", {
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
      const demoted = await prisma.blockKind.update({
        where: { id: blockKindId },
        data: { scope: "COACH", ownerId: data.newOwnerId },
      });

      logger.info("lms.library.block_kind.demoted", {
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
