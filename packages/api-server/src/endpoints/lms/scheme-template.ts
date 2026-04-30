import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type DemoteSchemeTemplateInput,
  type ListSchemeTemplatesQuery,
} from "@repo/contracts/lms/scheme-template";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import { requireAdmin, requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  mapToSchemeTemplate,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

import { createSchemeTemplateImpl } from "./scheme-template-create";
import { updateSchemeTemplateImpl } from "./scheme-template-update";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const buildVisibilityFilter = (role: UserRole, userId: string): Prisma.SchemeTemplateWhereInput => {
  if (role === UserRole.ADMIN || role === UserRole.HEAD_COACH) {
    return {};
  }

  return {
    OR: [{ scope: "SYSTEM" }, { scope: "COACH", ownerId: userId }],
  };
};

export const lmsSchemeTemplateApi = {
  list: async (userId: string, query: ListSchemeTemplatesQuery) => {
    const role = await requireCoachLikeRole(userId);

    const visibility = buildVisibilityFilter(role, userId);

    const where: Prisma.SchemeTemplateWhereInput = {
      ...visibility,
      ...(query.scope ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[query.scope] } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.archetypeKind
        ? { archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[query.archetypeKind] }
        : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    const items = await prisma.schemeTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      take: query.take,
    });

    return { items: items.map(mapToSchemeTemplate), total: items.length };
  },

  getById: async (userId: string, schemeTemplateId: string) => {
    const role = await requireCoachLikeRole(userId);

    const item = await findOrThrow(
      prisma.schemeTemplate.findUnique({ where: { id: schemeTemplateId } }),
      "Scheme template",
    );

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.HEAD_COACH &&
      item.scope === "COACH" &&
      item.ownerId !== userId
    ) {
      throw new NotFoundError("Scheme template not found", { schemeTemplateId });
    }

    return mapToSchemeTemplate(item);
  },

  create: createSchemeTemplateImpl,

  update: updateSchemeTemplateImpl,

  delete: async (userId: string, schemeTemplateId: string): Promise<void> => {
    const role = await requireCoachLikeRole(userId);

    const existing = await findOrThrow(
      prisma.schemeTemplate.findUnique({ where: { id: schemeTemplateId } }),
      "Scheme template",
    );

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    if (!isAdminPath) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM scheme templates are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Scheme template belongs to another coach");
      }
    }

    try {
      await prisma.schemeTemplate.update({
        where: { id: schemeTemplateId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme template" });
    }
  },

  promote: async (userId: string, schemeTemplateId: string) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.schemeTemplate.findUnique({ where: { id: schemeTemplateId } }),
      "Scheme template",
    );

    if (existing.scope === "SYSTEM") {
      throw new ConflictError("Scheme template is already SYSTEM-scoped", { schemeTemplateId });
    }

    const collision = await prisma.schemeTemplate.findFirst({
      where: { scope: "SYSTEM", name: existing.name, id: { not: schemeTemplateId } },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError(
        "SYSTEM library already contains a scheme template with this name",
        {
          existingId: collision.id,
          candidateName: existing.name,
        },
      );
    }

    try {
      const promoted = await prisma.schemeTemplate.update({
        where: { id: schemeTemplateId },
        data: { scope: "SYSTEM", ownerId: null },
      });

      logger.info("lms.library.scheme_template.promoted", {
        schemeTemplateId,
        fromScope: existing.scope,
        toScope: "SYSTEM",
      });

      return mapToSchemeTemplate(promoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme template", field: "name" });
    }
  },

  demote: async (userId: string, schemeTemplateId: string, data: DemoteSchemeTemplateInput) => {
    await requireAdmin(userId);

    const existing = await findOrThrow(
      prisma.schemeTemplate.findUnique({ where: { id: schemeTemplateId } }),
      "Scheme template",
    );

    if (existing.scope === "COACH") {
      throw new ConflictError("Scheme template is already COACH-scoped", { schemeTemplateId });
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

    const collision = await prisma.schemeTemplate.findFirst({
      where: {
        scope: "COACH",
        ownerId: data.newOwnerId,
        name: existing.name,
        id: { not: schemeTemplateId },
      },
      select: { id: true, name: true },
    });

    if (collision) {
      throw new BadRequestError("New owner already has a scheme template with this name", {
        existingId: collision.id,
        candidateName: existing.name,
      });
    }

    try {
      const demoted = await prisma.schemeTemplate.update({
        where: { id: schemeTemplateId },
        data: { scope: "COACH", ownerId: data.newOwnerId },
      });

      logger.info("lms.library.scheme_template.demoted", {
        schemeTemplateId,
        fromScope: existing.scope,
        toScope: "COACH",
        newOwnerId: data.newOwnerId,
      });

      return mapToSchemeTemplate(demoted);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme template", field: "name" });
    }
  },
};
