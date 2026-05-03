import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";

import {
  ActionItemResolveReason,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";

import { type TxClient } from "../../db/tx";
import {
  ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_SEVERITY_TO_PRISMA_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_TO_PRISMA_MAP,
} from "../../mappers/coaching";
import { asJsonRecord } from "../../utils/json-record";

import { type Condition } from "./coach-action-item-reconcile-conditions";

const conditionMatchesResolved = (
  condition: Condition,
  resolvedMetadata: JsonObject | null,
): boolean => {
  if (!resolvedMetadata) {
    return false;
  }

  switch (condition.type) {
    case ActionItemType.HEALTH_REPORT:
      return condition.metadata.healthStatus === resolvedMetadata.healthStatus;
    case ActionItemType.MISSED_WORKOUTS:
      return false;
    default:
      return false;
  }
};

export const partitionOpenItems = (
  openItems: PrismaCoachActionItemRecord[],
): {
  openByKey: Map<string, PrismaCoachActionItemRecord>;
  duplicates: PrismaCoachActionItemRecord[];
} => {
  const openByKey = new Map<string, PrismaCoachActionItemRecord>();
  const duplicates: PrismaCoachActionItemRecord[] = [];

  for (const item of openItems) {
    const key = `${item.type}:${item.athleteId}`;

    if (openByKey.has(key)) {
      duplicates.push(item);
    } else {
      openByKey.set(key, item);
    }
  }

  return { openByKey, duplicates };
};

export const resolveDuplicates = async (
  tx: TxClient,
  duplicates: PrismaCoachActionItemRecord[],
): Promise<number> => {
  if (duplicates.length === 0) {
    return 0;
  }

  const result = await tx.coachActionItem.updateMany({
    where: { id: { in: duplicates.map((d) => d.id) } },
    data: {
      status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
      resolvedAt: new Date(),
      resolveReason:
        ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[ActionItemResolveReason.AUTO_CONDITION_CLEARED],
    },
  });

  return result.count;
};

export type ApplyConditionsResult = { created: number; updated: number };

const updateExistingItem = async (
  tx: TxClient,
  existingOpen: PrismaCoachActionItemRecord,
  condition: Condition,
): Promise<boolean> => {
  const needsUpdate =
    existingOpen.message !== condition.message ||
    ACTION_ITEM_SEVERITY_MAP[existingOpen.severity] !== condition.severity;

  if (!needsUpdate) {
    return false;
  }

  await tx.coachActionItem.update({
    where: { id: existingOpen.id },
    data: {
      message: condition.message,
      severity: ACTION_ITEM_SEVERITY_TO_PRISMA_MAP[condition.severity],
      metadata: condition.metadata,
    },
  });

  return true;
};

const createActionItem = async (
  tx: TxClient,
  coachId: string,
  condition: Condition,
): Promise<void> => {
  await tx.coachActionItem.create({
    data: {
      coachId,
      athleteId: condition.athleteId,
      type: ACTION_ITEM_TYPE_TO_PRISMA_MAP[condition.type],
      severity: ACTION_ITEM_SEVERITY_TO_PRISMA_MAP[condition.severity],
      message: condition.message,
      metadata: condition.metadata,
    },
  });
};

export const applyConditions = async (
  tx: TxClient,
  args: {
    coachId: string;
    conditions: Condition[];
    openByKey: Map<string, PrismaCoachActionItemRecord>;
    resolvedByKey: Map<string, PrismaCoachActionItemRecord>;
  },
): Promise<ApplyConditionsResult> => {
  let created = 0;
  let updated = 0;

  for (const condition of args.conditions) {
    const key = `${condition.type}:${condition.athleteId}`;
    const existingOpen = args.openByKey.get(key);

    if (existingOpen) {
      const wasUpdated = await updateExistingItem(tx, existingOpen, condition);

      if (wasUpdated) {
        updated++;
      }

      args.openByKey.delete(key);
      continue;
    }

    const latestResolvedItem = args.resolvedByKey.get(key);

    if (
      latestResolvedItem &&
      conditionMatchesResolved(condition, asJsonRecord(latestResolvedItem.metadata))
    ) {
      continue;
    }

    await createActionItem(tx, args.coachId, condition);
    created++;
  }

  return { created, updated };
};

const groupOrphanIdsByReason = (
  openByKey: Map<string, PrismaCoachActionItemRecord>,
  activeAthleteIds: Set<string>,
): Map<ActionItemResolveReason, string[]> => {
  const idsByReason = new Map<ActionItemResolveReason, string[]>();

  for (const [key, item] of openByKey) {
    const athleteId = key.split(":")[1];

    if (!athleteId) {
      continue;
    }

    const reason = activeAthleteIds.has(athleteId)
      ? ActionItemResolveReason.AUTO_CONDITION_CLEARED
      : ActionItemResolveReason.AUTO_ASSIGNMENT_ENDED;

    const bucket = idsByReason.get(reason);

    if (bucket) {
      bucket.push(item.id);
    } else {
      idsByReason.set(reason, [item.id]);
    }
  }

  return idsByReason;
};

export const closeOrphanedOpenItems = async (
  tx: TxClient,
  args: {
    openByKey: Map<string, PrismaCoachActionItemRecord>;
    activeAthleteIds: Set<string>;
  },
): Promise<number> => {
  const idsByReason = groupOrphanIdsByReason(args.openByKey, args.activeAthleteIds);

  let resolved = 0;
  const now = new Date();

  for (const [reason, ids] of idsByReason) {
    if (ids.length === 0) {
      continue;
    }

    const result = await tx.coachActionItem.updateMany({
      where: { id: { in: ids } },
      data: {
        status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
        resolvedAt: now,
        resolveReason: ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[reason],
      },
    });

    resolved += result.count;
  }

  return resolved;
};
