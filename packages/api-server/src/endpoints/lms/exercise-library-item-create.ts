import { type Prisma } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type CreateExerciseLibraryItemInput } from "@repo/contracts/lms/exercise-library-item";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { requireCoachLikeRole } from "../../authz/guards";
import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";
import {
  BODY_PART_TO_PRISMA_MAP,
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  mapToExerciseLibraryItem,
  MODALITY_TO_PRISMA_MAP,
  MOVEMENT_PATTERN_TO_PRISMA_MAP,
  SKILL_LEVEL_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { handlePrismaError } from "../../utils";

const ADMIN_OR_COACH_LIKE: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const createExerciseLibraryItemImpl = async (
  userId: string,
  data: CreateExerciseLibraryItemInput,
) => {
  const role = await requireCoachLikeRole(userId);
  const isAdminPath = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;
  const scope = data.scope;

  if (scope === "SYSTEM" && !isAdminPath) {
    throw new ForbiddenError("Only admin or head_coach can create SYSTEM exercise items");
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
        "Owner is required when ADMIN or HEAD_COACH creates a COACH-scoped exercise item",
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
    const item = await prisma.exerciseLibraryItem.create({
      data: {
        scope: LIBRARY_SCOPE_TO_PRISMA_MAP[scope],
        ownerId,
        name: data.name,
        nameAliases: data.nameAliases,
        description: data.description ?? null,
        primaryMovement: MOVEMENT_PATTERN_TO_PRISMA_MAP[data.primaryMovement],
        modality: MODALITY_TO_PRISMA_MAP[data.modality],
        equipment: data.equipment,
        primaryBodyParts: data.primaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]),
        secondaryBodyParts: data.secondaryBodyParts.map((bp) => BODY_PART_TO_PRISMA_MAP[bp]),
        skillLevel: SKILL_LEVEL_TO_PRISMA_MAP[data.skillLevel],
        defaultMetrics: toJsonInput(data.defaultMetrics),
        demoVideoUrl: data.demoVideoUrl ?? null,
        demoImageUrl: data.demoImageUrl ?? null,
        parentId: data.parentId ?? null,
        isBenchmark: data.isBenchmark,
      },
    });

    return mapToExerciseLibraryItem(item);
  } catch (error) {
    return handlePrismaError(error, { entity: "Exercise library item", field: "name" });
  }
};
