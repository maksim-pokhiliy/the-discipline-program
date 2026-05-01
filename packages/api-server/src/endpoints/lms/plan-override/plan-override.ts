import {
  type CreatePlanOverrideBody,
  type CreatePlanOverrideInput,
  type EffectivePlanWeek,
  type ListPlanOverridesQuery,
  type PlanOverride,
  type UpdatePlanOverrideInput,
} from "@repo/contracts/lms/plan-override";
import { BadRequestError } from "@repo/errors";
import { logger } from "@repo/shared";

import { verifyPlanOwnership } from "../../../authz/guards";
import { prisma, prismaAsCore } from "../../../db/client";
import { mapToPlanOverride } from "../../../mappers/lms";
import { resolveEffectivePlan } from "../../../services/lms/plan-override-resolver";
import { findOrThrow, handlePrismaError, toInputJson } from "../../../utils";

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

const APPEND_VALID_SCOPES = new Set(["BLOCK", "BLOCK_SEGMENT"]);

const validateScopeKindCombo = (scope: string, kind: string): void => {
  if (kind === "APPEND" && !APPEND_VALID_SCOPES.has(scope)) {
    throw new BadRequestError(
      `APPEND override is not valid for scope ${scope}. Valid scopes: BLOCK, BLOCK_SEGMENT`,
    );
  }
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
          payload: toInputJson(data.payload ?? null),
          startsOnWeekIndex: data.startsOnWeekIndex ?? null,
          endsOnWeekIndex: data.endsOnWeekIndex ?? null,
        },
      });

      return mapToPlanOverride(override);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan override" });
    }
  },

  createForEnrollment: async (
    userId: string,
    enrollmentId: string,
    data: CreatePlanOverrideBody,
  ): Promise<PlanOverride> => {
    await verifyEnrollmentBelongsToCoach(enrollmentId, userId);

    validateScopeKindCombo(data.scope, data.kind);

    try {
      const created = await prisma.planOverride.create({
        data: {
          enrollmentId,
          scope: data.scope,
          scopeId: data.scopeId,
          kind: data.kind,
          payload: toInputJson(data.payload),
          startsOnWeekIndex: data.startsOnWeekIndex ?? null,
          endsOnWeekIndex: data.endsOnWeekIndex ?? null,
        },
      });

      logger.info("lms.coach.override_created", {
        actingUserId: userId,
        enrollmentId,
        overrideId: created.id,
        scope: created.scope,
        kind: created.kind,
      });

      return mapToPlanOverride(created);
    } catch (error) {
      return handlePrismaError(error, { entity: "Plan override" });
    }
  },

  listForEnrollment: async (userId: string, enrollmentId: string): Promise<PlanOverride[]> => {
    await verifyEnrollmentBelongsToCoach(enrollmentId, userId);

    const items = await prisma.planOverride.findMany({
      where: { enrollmentId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return items.map(mapToPlanOverride);
  },

  deleteById: async (userId: string, overrideId: string): Promise<void> => {
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
          ...(data.payload !== undefined ? { payload: toInputJson(data.payload) } : {}),
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

  getEffectivePlan: async (
    userId: string,
    enrollmentId: string,
    weekIndex: number,
  ): Promise<EffectivePlanWeek> => {
    await verifyEnrollmentBelongsToCoach(enrollmentId, userId);

    return resolveEffectivePlan({ db: prismaAsCore, enrollmentId, weekIndex });
  },
};
