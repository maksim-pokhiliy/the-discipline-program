import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteBlockTemplateInput,
  type ListBlockTemplatesQuery,
} from "@repo/contracts/lms/block-template";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToBlockTemplate } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";

import { createBlockTemplateImpl } from "./block-template-create";
import { updateBlockTemplateImpl } from "./block-template-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (role: UserRole, userId: string): Prisma.BlockTemplateWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsBlockTemplateApi = {
  list: async (userId: string, query: ListBlockTemplatesQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.BlockTemplateWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.blockTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      ...(query.take !== undefined && { take: query.take }),
    });

    return { items: items.map(mapToBlockTemplate), total: items.length };
  },

  getById: async (userId: string, blockTemplateId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
      "Block template",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Block template not found", { blockTemplateId });
    }

    return mapToBlockTemplate(item);
  },

  create: createBlockTemplateImpl,

  update: updateBlockTemplateImpl,

  delete: async (userId: string, blockTemplateId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
      "Block template",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM block templates are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Block template belongs to another coach");
      }
    }

    try {
      await prisma.blockTemplate.update({
        where: { id: blockTemplateId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block template" });
    }
  },

  promote: async (userId: string, blockTemplateId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
      "Block template",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Block template is already SYSTEM-scoped", { blockTemplateId });
    }

    const collision = await prisma.blockTemplate.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: blockTemplateId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("SYSTEM library already contains a block template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.blockTemplate.updateMany({
        where: { id: blockTemplateId, version: existing.version },
        data: { scope: "SYSTEM", ownerId: null, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          blockTemplateId,
        });
      }

      const promoted = await findOrThrow(
        prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
        "Block template",
      );

      logger.info("lms.library.block_template.promoted", {
        actingUserId: userId,
        blockTemplateId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToBlockTemplate(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block template", field: "name" });
    }
  },

  demote: async (userId: string, blockTemplateId: string, data: DemoteBlockTemplateInput) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
      "Block template",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Block template is already COACH-scoped", { blockTemplateId });
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

    const collision = await prisma.blockTemplate.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: blockTemplateId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has a block template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.blockTemplate.updateMany({
        where: { id: blockTemplateId, version: existing.version },
        data: { scope: "COACH", ownerId: data.newOwnerId, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          blockTemplateId,
        });
      }

      const demoted = await findOrThrow(
        prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
        "Block template",
      );

      logger.info("lms.library.block_template.demoted", {
        actingUserId: userId,
        blockTemplateId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToBlockTemplate(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block template", field: "name" });
    }
  },
};
