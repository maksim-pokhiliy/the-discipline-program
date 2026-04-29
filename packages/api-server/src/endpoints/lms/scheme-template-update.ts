import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateSchemeTemplateInput } from "@repo/contracts/lms/scheme-template";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
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

export const updateSchemeTemplateImpl = async (
  userId: string,
  schemeTemplateId: string,
  data: UpdateSchemeTemplateInput,
) => {
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
};
