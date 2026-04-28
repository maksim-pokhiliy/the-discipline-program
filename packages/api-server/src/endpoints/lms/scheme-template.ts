import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type CreateSchemeTemplateInput,
  type DemoteSchemeTemplateInput,
  type ListSchemeTemplatesQuery,
  type UpdateSchemeTemplateInput,
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

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

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

  create: async (userId: string, data: CreateSchemeTemplateInput) => {
    const role = await requireCoachLikeRole(userId);

    const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;
    const scope = data.scope;
    const ownerId = scope === "SYSTEM" ? null : userId;

    if (scope === "SYSTEM" && !isAdminPath) {
      throw new ForbiddenError("Only admin or head_coach can create SYSTEM scheme templates");
    }

    try {
      const item = await prisma.schemeTemplate.create({
        data: {
          scope: LIBRARY_SCOPE_TO_PRISMA_MAP[scope],
          ownerId,
          name: data.name,
          description: data.description ?? null,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind],
          defaultParams: toJsonInput(data.defaultParams),
        },
      });

      return mapToSchemeTemplate(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme template", field: "name" });
    }
  },

  update: async (userId: string, schemeTemplateId: string, data: UpdateSchemeTemplateInput) => {
    const role = await requireCoachLikeRole(userId);
    const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    const existing = await findOrThrow(
      prisma.schemeTemplate.findUnique({ where: { id: schemeTemplateId } }),
      "Scheme template",
    );

    if (!isPrivileged) {
      if (existing.scope === "SYSTEM") {
        throw new ForbiddenError("SYSTEM scheme templates are read-only for coaches");
      }

      if (existing.ownerId !== userId) {
        throw new ForbiddenError("Scheme template belongs to another coach");
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

        const collision = await prisma.schemeTemplate.findFirst({
          where: { scope: "SYSTEM", name: existing.name, id: { not: schemeTemplateId } },
          select: { id: true },
        });

        if (collision) {
          throw new BadRequestError(
            "SYSTEM library already contains a scheme template with this name",
          );
        }
      } else {
        const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

        if (!newOwnerId) {
          throw new BadRequestError("COACH-scoped scheme template requires ownerId");
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

        const collision = await prisma.schemeTemplate.findFirst({
          where: {
            scope: "COACH",
            ownerId: newOwnerId,
            name: existing.name,
            id: { not: schemeTemplateId },
          },
          select: { id: true },
        });

        if (collision) {
          throw new BadRequestError("Owner already has a scheme template with this name");
        }

        resolvedOwnerId = newOwnerId;
      }
    }

    try {
      const item = await prisma.schemeTemplate.update({
        where: { id: schemeTemplateId },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.archetypeKind
            ? { archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind] }
            : {}),
          ...(data.defaultParams !== undefined
            ? { defaultParams: toJsonInput(data.defaultParams) }
            : {}),
          ...(isPrivileged && wantsScopeChange
            ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[targetScope] }
            : {}),
          ...(isPrivileged && (wantsScopeChange || wantsOwnerChange)
            ? { ownerId: resolvedOwnerId }
            : {}),
        },
      });

      return mapToSchemeTemplate(item);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme template", field: "name" });
    }
  },

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
