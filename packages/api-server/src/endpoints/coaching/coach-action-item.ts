import {
  ActionItemResolveReason,
  ActionItemStatus,
  type CoachActionItem,
  type ReconcileResponse,
} from "@repo/contracts/coaching/coach-action-item";
import { NotFoundError } from "@repo/errors";

import { resolveCoachId } from "../../authz/guards";
import { prisma } from "../../db/client";
import { TX_BUDGET_LONG } from "../../db/transaction-config";
import { inMemoryCache } from "../../infrastructure/cache";
import {
  ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  mapToCoachActionItem,
} from "../../mappers/coaching";
import { findOrThrow, handlePrismaError } from "../../utils";

import { buildAssignedAthleteInclude } from "./assigned-athlete-query";
import {
  applyConditions,
  closeOrphanedOpenItems,
  computeBaseConditions,
  computeMissedWorkoutsConditions,
  partitionOpenItems,
  resolveDuplicates,
} from "./coach-action-item-reconcile";

const RECONCILE_CACHE_TTL_SECONDS = 60;
const CACHED_RECONCILE_RESPONSE: ReconcileResponse = { created: 0, updated: 0, resolved: 0 };

const buildReconcileCacheKey = (coachId: string): string => `reconcile:${coachId}`;

export const coachingCoachActionItemApi = {
  reconcile: async (userId: string): Promise<ReconcileResponse & { coachId: string }> => {
    const coachId = await resolveCoachId(userId);

    const cacheKey = buildReconcileCacheKey(coachId);
    const cached = await inMemoryCache.get<true>(cacheKey);

    if (cached) {
      return { ...CACHED_RECONCILE_RESPONSE, coachId };
    }

    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      "User",
    );

    const tz = user.timezone;

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reconcile:${coachId}`}))`;

        const [assignments, openItems, latestResolved] = await Promise.all([
          tx.coachAthleteAssignment.findMany({
            where: { coachId },
            include: buildAssignedAthleteInclude(userId),
          }),
          tx.coachActionItem.findMany({
            where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
          }),
          tx.coachActionItem.findMany({
            where: {
              coachId,
              status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
            },
            orderBy: { resolvedAt: "desc" },
            distinct: ["athleteId", "type"],
          }),
        ]);

        const baseConditions = computeBaseConditions(assignments);
        const missedConditions = await computeMissedWorkoutsConditions(assignments, tz);
        const conditions = [...baseConditions, ...missedConditions];

        const { openByKey, duplicates } = partitionOpenItems(openItems);

        const resolvedByKey = new Map(
          latestResolved.map((item) => [`${item.type}:${item.athleteId}`, item]),
        );

        const activeAthleteIds = new Set(assignments.map((a) => a.athleteId));

        const duplicatesResolved = await resolveDuplicates(tx, duplicates);
        const { created, updated } = await applyConditions(tx, {
          coachId,
          conditions,
          openByKey,
          resolvedByKey,
        });
        const orphansResolved = await closeOrphanedOpenItems(tx, { openByKey, activeAthleteIds });

        return {
          created,
          updated,
          resolved: duplicatesResolved + orphansResolved,
          coachId,
        };
      }, TX_BUDGET_LONG);

      await inMemoryCache.set(cacheKey, true, { ttlSeconds: RECONCILE_CACHE_TTL_SECONDS });

      return result;
    } catch (error) {
      return handlePrismaError(error, { entity: "Action item" });
    }
  },

  resolve: async (userId: string, itemId: string): Promise<CoachActionItem> => {
    const coachId = await resolveCoachId(userId);

    const item = await prisma.coachActionItem.findUnique({ where: { id: itemId } });

    if (!item || item.coachId !== coachId) {
      throw new NotFoundError("Action item not found", { itemId });
    }

    if (ACTION_ITEM_STATUS_MAP[item.status] === ActionItemStatus.RESOLVED) {
      return mapToCoachActionItem(item);
    }

    try {
      const updated = await prisma.coachActionItem.update({
        where: { id: itemId },
        data: {
          status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
          resolvedAt: new Date(),
          resolveReason:
            ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[ActionItemResolveReason.MANUAL_CONTACTED],
        },
      });

      await inMemoryCache.delete(buildReconcileCacheKey(coachId));

      return mapToCoachActionItem(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Action item" });
    }
  },
};
