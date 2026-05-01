import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteSessionTemplateInput,
  type ListSessionTemplatesQuery,
} from "@repo/contracts/lms/session-template";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToSessionTemplate } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { createSessionTemplateImpl } from "./session-template-create";
import { updateSessionTemplateImpl } from "./session-template-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (
  role: UserRole,
  userId: string,
): Prisma.SessionTemplateWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsSessionTemplateApi = {
  list: async (userId: string, query: ListSessionTemplatesQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.SessionTemplateWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.sessionTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      take: query.take,
    });

    return { items: items.map(mapToSessionTemplate), total: items.length };
  },

  getById: async (userId: string, sessionTemplateId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
      "Session template",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Session template not found", { sessionTemplateId });
    }

    return mapToSessionTemplate(item);
  },

  create: createSessionTemplateImpl,

  update: updateSessionTemplateImpl,

  delete: async (userId: string, sessionTemplateId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
      "Session template",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM session templates are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Session template belongs to another coach");
      }
    }

    try {
      await prisma.sessionTemplate.update({
        where: { id: sessionTemplateId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Session template" });
    }
  },

  promote: async (userId: string, sessionTemplateId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
      "Session template",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Session template is already SYSTEM-scoped", { sessionTemplateId });
    }

    const collision = await prisma.sessionTemplate.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: sessionTemplateId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError(
        "SYSTEM library already contains a session template with this name",
        {
          existingId: collision.id,
          candidateName: existing.name,
        },
      );
    }

    try {
      const updateResult = await prisma.sessionTemplate.updateMany({
        where: { id: sessionTemplateId, version: existing.version },
        data: { scope: "SYSTEM", ownerId: null, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          sessionTemplateId,
        });
      }

      const promoted = await findOrThrow(
        prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
        "Session template",
      );

      logger.info("lms.library.session_template.promoted", {
        actingUserId: userId,
        sessionTemplateId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToSessionTemplate(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session template", field: "name" });
    }
  },

  demote: async (userId: string, sessionTemplateId: string, data: DemoteSessionTemplateInput) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
      "Session template",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Session template is already COACH-scoped", { sessionTemplateId });
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

    const collision = await prisma.sessionTemplate.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: sessionTemplateId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has a session template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.sessionTemplate.updateMany({
        where: { id: sessionTemplateId, version: existing.version },
        data: { scope: "COACH", ownerId: data.newOwnerId, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          sessionTemplateId,
        });
      }

      const demoted = await findOrThrow(
        prisma.sessionTemplate.findUnique({ where: { id: sessionTemplateId } }),
        "Session template",
      );

      logger.info("lms.library.session_template.demoted", {
        actingUserId: userId,
        sessionTemplateId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToSessionTemplate(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session template", field: "name" });
    }
  },
};
