import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateWeekTemplateInput } from "@repo/contracts/lms/week-template";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToWeekTemplate } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError, toInputJson } from "../../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

export const updateWeekTemplateImpl = async (
  userId: string,
  weekTemplateId: string,
  data: UpdateWeekTemplateInput,
) => {
  const role = await requireCoachLikeRole(userId);
  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  const existing = await findOrThrow(
    prisma.weekTemplate.findUnique({ where: { id: weekTemplateId } }),
    "Week template",
  );

  if (!isPrivileged) {
    if (existing.scope === "SYSTEM") {
      throw new ForbiddenError("SYSTEM week templates are read-only for coaches");
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenError("Week template belongs to another coach");
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

      const collision = await prisma.weekTemplate.findFirst({
        where: { scope: "SYSTEM", name: existing.name, id: { not: weekTemplateId } },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError("SYSTEM library already contains a week template with this name");
      }
    } else {
      const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

      if (!newOwnerId) {
        throw new BadRequestError("COACH-scoped week template requires ownerId");
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

      const collision = await prisma.weekTemplate.findFirst({
        where: {
          scope: "COACH",
          ownerId: newOwnerId,
          name: existing.name,
          id: { not: weekTemplateId },
        },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError("Owner already has a week template with this name");
      }

      resolvedOwnerId = newOwnerId;
    }
  }

  try {
    const item = await prisma.weekTemplate.update({
      where: { id: weekTemplateId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.payload !== undefined ? { payload: toInputJson(data.payload) } : {}),
        ...(isPrivileged && wantsScopeChange
          ? { scope: LIBRARY_SCOPE_TO_PRISMA_MAP[targetScope] }
          : {}),
        ...(isPrivileged && (wantsScopeChange || wantsOwnerChange)
          ? { ownerId: resolvedOwnerId }
          : {}),
      },
    });

    return mapToWeekTemplate(item);
  } catch (error) {
    return handlePrismaError(error, { entity: "Week template", field: "name" });
  }
};
