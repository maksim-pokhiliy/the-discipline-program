import { UserRole } from "@repo/contracts/iam/auth";
import { type CreateWeekTemplateInput } from "@repo/contracts/lms/week-template";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import { LIBRARY_SCOPE_TO_PRISMA_MAP, mapToWeekTemplate } from "../../mappers/lms";
import { handlePrismaError, toInputJson } from "../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

export const createWeekTemplateImpl = async (userId: string, data: CreateWeekTemplateInput) => {
  const role = await requireCoachLikeRole(userId);
  const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;
  const scope = data.scope;

  if (scope === "SYSTEM" && !isAdminPath) {
    throw new ForbiddenError("Only admin or head_coach can create SYSTEM week templates");
  }

  if (!isAdminPath && data.ownerId !== undefined && data.ownerId !== null) {
    throw new ForbiddenError("Only ADMIN or HEAD_COACH can specify ownerId on create");
  }

  let ownerId: string | null;

  if (scope === "SYSTEM") {
    ownerId = null;
  } else if (isAdminPath) {
    if (!data.ownerId) {
      throw new BadRequestError(
        "Owner is required when ADMIN or HEAD_COACH creates a COACH-scoped week template",
      );
    }

    const candidate = await prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { role: true },
    });

    if (!candidate) {
      throw new NotFoundError("Owner user not found", { ownerId: data.ownerId });
    }

    if (!ADMIN_OR_COACH_LIKE.has(ROLE_MAP[candidate.role])) {
      throw new BadRequestError("Owner must be a coach-like user", { ownerId: data.ownerId });
    }

    ownerId = data.ownerId;
  } else {
    ownerId = userId;
  }

  try {
    const item = await prisma.weekTemplate.create({
      data: {
        scope: LIBRARY_SCOPE_TO_PRISMA_MAP[scope],
        ownerId,
        name: data.name,
        description: data.description ?? null,
        payload: toInputJson(data.payload),
      },
    });

    return mapToWeekTemplate(item);
  } catch (error) {
    return handlePrismaError(error, { entity: "Week template", field: "name" });
  }
};
