import { type Prisma } from "@prisma/client";

import {
  type CreatePlanOverrideInput,
  type ListPlanOverridesQuery,
  type UpdatePlanOverrideInput,
} from "@repo/contracts/lms/plan-override";
import { BadRequestError } from "@repo/errors";

import { verifyPlanOwnership } from "../../authz/guards";
import { prisma } from "../../db/client";
import { mapToPlanOverride } from "../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../utils";

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const verifyEnrollmentBelongsToCoach = async (
  enrollmentId: string,
  userId: string,
): Promise<void> => {
  const enrollment = await findOrThrow(
    prisma.planEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { planId: true },
    }),
    "Plan enrollment",
  );

  await verifyPlanOwnership(enrollment.planId, userId);
};

export const lmsPlanOverrideApi = {
  list: async (userId: string, query: ListPlanOverridesQuery) => {
    if (!query.enrollmentId) {
      throw new BadRequestError("enrollmentId is required to list plan overrides");
    }

    await verifyEnrollmentBelongsToCoach(query.enrollmentId, userId);

    const items = await prisma.planOverride.findMany({
      where: {
        enrollmentId: query.enrollmentId,
        ...(query.scope ? { scope: query.scope } : {}),
        ...(query.scopeId ? { scopeId: query.scopeId } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return { items: items.map(mapToPlanOverride), total: items.length };
  },

  getById: async (userId: string, overrideId: string) => {
    const override = await findOrThrow(
      prisma.planOverride.findUnique({ where: { id: overrideId } }),
      "Plan override",
    );

    await verifyEnrollmentBelongsToCoach(override.enrollmentId, userId);

    return mapToPlanOverride(override);
  },

  create: async (userId: string, data: CreatePlanOverrideInput) => {
    await verifyEnrollmentBelongsToCoach(data.enrollmentId, userId);

    try {
      const override = await prisma.planOverride.create({
        data: {
          enrollmentId: data.enrollmentId,
          scope: data.scope,
          scopeId: data.scopeId,
          kind: data.kind,
          payload: toJsonInput(data.payload ?? null),
          startsOnWeekIndex: data.startsOnWeekIndex ?? null,
          endsOnWeekIndex: data.endsOnWeekIndex ?? null,
        },
      });

      return mapToPlanOverride(override);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan override" });
    }
  },

  update: async (userId: string, overrideId: string, data: UpdatePlanOverrideInput) => {
    const existing = await findOrThrow(
      prisma.planOverride.findUnique({ where: { id: overrideId } }),
      "Plan override",
    );

    await verifyEnrollmentBelongsToCoach(existing.enrollmentId, userId);

    try {
      const override = await prisma.planOverride.update({
        where: { id: overrideId },
        data: {
          ...(data.scope ? { scope: data.scope } : {}),
          ...(data.scopeId ? { scopeId: data.scopeId } : {}),
          ...(data.kind ? { kind: data.kind } : {}),
          ...(data.payload !== undefined ? { payload: toJsonInput(data.payload) } : {}),
          ...(data.startsOnWeekIndex !== undefined
            ? { startsOnWeekIndex: data.startsOnWeekIndex }
            : {}),
          ...(data.endsOnWeekIndex !== undefined ? { endsOnWeekIndex: data.endsOnWeekIndex } : {}),
        },
      });

      return mapToPlanOverride(override);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan override" });
    }
  },

  delete: async (userId: string, overrideId: string): Promise<void> => {
    const existing = await findOrThrow(
      prisma.planOverride.findUnique({ where: { id: overrideId } }),
      "Plan override",
    );

    await verifyEnrollmentBelongsToCoach(existing.enrollmentId, userId);

    try {
      await prisma.planOverride.delete({ where: { id: overrideId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan override" });
    }
  },
};
