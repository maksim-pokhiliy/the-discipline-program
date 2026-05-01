import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateBlockTemplateInput } from "@repo/contracts/lms/block-template";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToBlockTemplate } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError, toInputJson } from "../../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

export const updateBlockTemplateImpl = async (
  userId: string,
  blockTemplateId: string,
  data: UpdateBlockTemplateInput,
) => {
  const role = await requireCoachLikeRole(userId);
  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  const existing = await findOrThrow(
    prisma.blockTemplate.findUnique({ where: { id: blockTemplateId } }),
    "Block template",
  );

  if (!isPrivileged) {
    if (existing.scope === "SYSTEM") {
      throw new ForbiddenError("SYSTEM block templates are read-only for coaches");
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenError("Block template belongs to another coach");
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

      const collision = await prisma.blockTemplate.findFirst({
        where: { scope: "SYSTEM", name: existing.name, id: { not: blockTemplateId } },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError(
          "SYSTEM library already contains a block template with this name",
        );
      }
    } else {
      const newOwnerId = data.ownerId !== undefined ? data.ownerId : existing.ownerId;

      if (!newOwnerId) {
        throw new BadRequestError("COACH-scoped block template requires ownerId");
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

      const collision = await prisma.blockTemplate.findFirst({
        where: {
          scope: "COACH",
          ownerId: newOwnerId,
          name: existing.name,
          id: { not: blockTemplateId },
        },
        select: { id: true },
      });

      if (collision) {
        throw new BadRequestError("Owner already has a block template with this name");
      }

      resolvedOwnerId = newOwnerId;
    }
  }

  try {
    const item = await prisma.blockTemplate.update({
      where: { id: blockTemplateId },
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

    return mapToBlockTemplate(item);
  } catch (error) {
    return handlePrismaError(error, { entity: "Block template", field: "name" });
  }
};
