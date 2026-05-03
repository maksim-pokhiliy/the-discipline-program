import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";
import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../../../db/client";

import { collectOpIds } from "./collect-op-ids";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const collectEntryExerciseIds = (ops: BulkPatchOp[]): string[] => {
  const ids: string[] = [];

  for (const op of ops) {
    if (op.kind === "update-entry") {
      ids.push(op.fullEntity.exerciseId);
    } else if (op.kind === "create-entry") {
      ids.push(op.payload.exerciseId);
    }
  }

  return ids;
};

const verifyPlanIdsMatch = (opPlanIds: Set<string>, routePlanId: string): void => {
  for (const opPlanId of opPlanIds) {
    if (opPlanId !== routePlanId) {
      throw new NotFoundError("Bulk-patch op references another plan", { opPlanId });
    }
  }
};

const verifyWeekOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const weeks = await tx.week.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, planId: true },
  });

  if (weeks.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing week");
  }

  for (const w of weeks) {
    if (w.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a week from another plan", {
        weekId: w.id,
      });
    }
  }
};

const verifyDayOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const days = await tx.day.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, week: { select: { planId: true } } },
  });

  if (days.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing day");
  }

  for (const d of days) {
    if (d.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a day from another plan", { dayId: d.id });
    }
  }
};

const verifySessionOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const sessions = await tx.lmsSession.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, day: { select: { week: { select: { planId: true } } } } },
  });

  if (sessions.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing session");
  }

  for (const s of sessions) {
    if (s.day.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a session from another plan", {
        sessionId: s.id,
      });
    }
  }
};

const verifyBlockOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const blocks = await tx.block.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      session: { select: { day: { select: { week: { select: { planId: true } } } } } },
    },
  });

  if (blocks.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing block");
  }

  for (const b of blocks) {
    if (b.session.day.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a block from another plan", {
        blockId: b.id,
      });
    }
  }
};

const verifySegmentOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const segments = await tx.blockSegment.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      block: {
        select: {
          session: { select: { day: { select: { week: { select: { planId: true } } } } } },
        },
      },
    },
  });

  if (segments.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing segment");
  }

  for (const s of segments) {
    if (s.block.session.day.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a segment from another plan", {
        segmentId: s.id,
      });
    }
  }
};

const verifySetGroupOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const setGroups = await tx.setGroup.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      segment: {
        select: {
          block: {
            select: {
              session: { select: { day: { select: { week: { select: { planId: true } } } } } },
            },
          },
        },
      },
    },
  });

  if (setGroups.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing set group");
  }

  for (const g of setGroups) {
    if (g.segment.block.session.day.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references a set group from another plan", {
        setGroupId: g.id,
      });
    }
  }
};

const verifyEntryOwnership = async (
  tx: TxClient,
  ids: Set<string>,
  planId: string,
): Promise<void> => {
  if (ids.size === 0) {
    return;
  }

  const entries = await tx.exerciseEntry.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      setGroup: {
        select: {
          segment: {
            select: {
              block: {
                select: {
                  session: {
                    select: { day: { select: { week: { select: { planId: true } } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (entries.length !== ids.size) {
    throw new NotFoundError("Bulk-patch op references a missing entry");
  }

  for (const e of entries) {
    if (e.setGroup.segment.block.session.day.week.planId !== planId) {
      throw new NotFoundError("Bulk-patch op references an entry from another plan", {
        entryId: e.id,
      });
    }
  }
};

export const verifyOpsBelongToPlan = async (
  tx: TxClient,
  planId: string,
  ops: BulkPatchOp[],
): Promise<void> => {
  const collected = collectOpIds(ops);

  verifyPlanIdsMatch(collected.planIds, planId);
  await verifyWeekOwnership(tx, collected.weekIds, planId);
  await verifyDayOwnership(tx, collected.dayIds, planId);
  await verifySessionOwnership(tx, collected.sessionIds, planId);
  await verifyBlockOwnership(tx, collected.blockIds, planId);
  await verifySegmentOwnership(tx, collected.segmentIds, planId);
  await verifySetGroupOwnership(tx, collected.setGroupIds, planId);
  await verifyEntryOwnership(tx, collected.entryIds, planId);
};
