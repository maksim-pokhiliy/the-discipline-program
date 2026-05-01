import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteWeekTemplateInput,
  type ListWeekTemplatesQuery,
} from "@repo/contracts/lms/week-template";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToWeekTemplate } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { createWeekTemplateImpl } from "./week-template-create";
import { updateWeekTemplateImpl } from "./week-template-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (role: UserRole, userId: string): Prisma.WeekTemplateWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsWeekTemplateApi = {
  list: async (userId: string, query: ListWeekTemplatesQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.WeekTemplateWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.weekTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      ...(query.take !== undefined && { take: query.take }),
    });

    return { items: items.map(mapToWeekTemplate), total: items.length };
  },

  getById: async (userId: string, weekTemplateId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
      "Week template",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Week template not found", { weekTemplateId });
    }

    return mapToWeekTemplate(item);
  },

  create: createWeekTemplateImpl,

  update: updateWeekTemplateImpl,

  delete: async (userId: string, weekTemplateId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
      "Week template",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM week templates are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Week template belongs to another coach");
      }
    }

    try {
      await prisma.weekTemplate.update({
        where: { id: weekTemplateId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Week template" });
    }
  },

  promote: async (userId: string, weekTemplateId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
      "Week template",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Week template is already SYSTEM-scoped", { weekTemplateId });
    }

    const collision = await prisma.weekTemplate.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: weekTemplateId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("SYSTEM library already contains a week template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.weekTemplate.updateMany({
        where: { id: weekTemplateId, version: existing.version },
        data: { scope: "SYSTEM", ownerId: null, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          weekTemplateId,
        });
      }

      const promoted = await findOrThrow(
        prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
        "Week template",
      );

      logger.info("lms.library.week_template.promoted", {
        actingUserId: userId,
        weekTemplateId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToWeekTemplate(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week template", field: "name" });
    }
  },

  demote: async (userId: string, weekTemplateId: string, data: DemoteWeekTemplateInput) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
      "Week template",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Week template is already COACH-scoped", { weekTemplateId });
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

    const collision = await prisma.weekTemplate.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: weekTemplateId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has a week template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const updateResult = await prisma.weekTemplate.updateMany({
        where: { id: weekTemplateId, version: existing.version },
        data: { scope: "COACH", ownerId: data.newOwnerId, version: { increment: 1 } },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("Promotion state changed; refresh and try again", {
          weekTemplateId,
        });
      }

      const demoted = await findOrThrow(
        prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
        "Week template",
      );

      logger.info("lms.library.week_template.demoted", {
        actingUserId: userId,
        weekTemplateId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToWeekTemplate(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Week template", field: "name" });
    }
  },
};
