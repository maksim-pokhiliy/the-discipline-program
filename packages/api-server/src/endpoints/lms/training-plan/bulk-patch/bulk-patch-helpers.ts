import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";
import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../../../db/client";

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

const collectIds = (ops: BulkPatchOp[]) => {
  const blockIds = new Set<string>();
  const segmentIds = new Set<string>();
  const entryIds = new Set<string>();
  const sessionIds = new Set<string>();
  const setGroupIds = new Set<string>();
  const weekIds = new Set<string>();
  const dayIds = new Set<string>();
  const planIds = new Set<string>();

  for (const op of ops) {
    switch (op.kind) {
      case "update-block":
      case "delete-block": {
        blockIds.add(op.blockId);
        break;
      }
      case "move-block": {
        blockIds.add(op.blockId);
        sessionIds.add(op.targetSessionId);
        break;
      }
      case "update-segment":
      case "delete-segment": {
        segmentIds.add(op.segmentId);
        break;
      }
      case "move-segment": {
        segmentIds.add(op.segmentId);
        blockIds.add(op.targetBlockId);
        break;
      }
      case "update-entry":
      case "delete-entry": {
        entryIds.add(op.entryId);
        break;
      }
      case "move-entry": {
        entryIds.add(op.entryId);
        setGroupIds.add(op.targetSetGroupId);
        break;
      }
      case "create-block": {
        sessionIds.add(op.sessionId);
        break;
      }
      case "create-segment": {
        blockIds.add(op.blockId);
        break;
      }
      case "create-entry": {
        setGroupIds.add(op.setGroupId);
        break;
      }
      case "clone-block-subtree": {
        blockIds.add(op.sourceBlockId);
        sessionIds.add(op.targetSessionId);
        break;
      }
      case "create-week": {
        planIds.add(op.planId);
        break;
      }
      case "update-week":
      case "delete-week": {
        weekIds.add(op.weekId);
        break;
      }
      case "create-day": {
        weekIds.add(op.weekId);
        break;
      }
      case "update-day":
      case "delete-day": {
        dayIds.add(op.dayId);
        break;
      }
      case "create-session": {
        dayIds.add(op.dayId);
        break;
      }
      case "update-session":
      case "delete-session": {
        sessionIds.add(op.sessionId);
        break;
      }
    }
  }

  return { blockIds, segmentIds, entryIds, sessionIds, setGroupIds, weekIds, dayIds, planIds };
};

export const verifyOpsBelongToPlan = async (
  tx: TxClient,
  planId: string,
  ops: BulkPatchOp[],
): Promise<void> => {
  const { blockIds, segmentIds, entryIds, sessionIds, setGroupIds, weekIds, dayIds, planIds } =
    collectIds(ops);

  for (const opPlanId of planIds) {
    if (opPlanId !== planId) {
      throw new NotFoundError("Bulk-patch op references another plan", {
        opPlanId,
      });
    }
  }

  if (weekIds.size > 0) {
    const weeks = await tx.week.findMany({
      where: { id: { in: [...weekIds] } },
      select: { id: true, planId: true },
    });

    if (weeks.length !== weekIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing week");
    }

    for (const w of weeks) {
      if (w.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a week from another plan", {
          weekId: w.id,
        });
      }
    }
  }

  if (dayIds.size > 0) {
    const days = await tx.day.findMany({
      where: { id: { in: [...dayIds] } },
      select: { id: true, week: { select: { planId: true } } },
    });

    if (days.length !== dayIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing day");
    }

    for (const d of days) {
      if (d.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a day from another plan", {
          dayId: d.id,
        });
      }
    }
  }

  if (sessionIds.size > 0) {
    const sessions = await tx.lmsSession.findMany({
      where: { id: { in: [...sessionIds] } },
      select: {
        id: true,
        day: { select: { week: { select: { planId: true } } } },
      },
    });

    if (sessions.length !== sessionIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing session");
    }

    for (const s of sessions) {
      if (s.day.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a session from another plan", {
          sessionId: s.id,
        });
      }
    }
  }

  if (blockIds.size > 0) {
    const blocks = await tx.block.findMany({
      where: { id: { in: [...blockIds] } },
      select: {
        id: true,
        session: { select: { day: { select: { week: { select: { planId: true } } } } } },
      },
    });

    if (blocks.length !== blockIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing block");
    }

    for (const b of blocks) {
      if (b.session.day.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a block from another plan", {
          blockId: b.id,
        });
      }
    }
  }

  if (segmentIds.size > 0) {
    const segments = await tx.blockSegment.findMany({
      where: { id: { in: [...segmentIds] } },
      select: {
        id: true,
        block: {
          select: {
            session: { select: { day: { select: { week: { select: { planId: true } } } } } },
          },
        },
      },
    });

    if (segments.length !== segmentIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing segment");
    }

    for (const s of segments) {
      if (s.block.session.day.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a segment from another plan", {
          segmentId: s.id,
        });
      }
    }
  }

  if (setGroupIds.size > 0) {
    const setGroups = await tx.setGroup.findMany({
      where: { id: { in: [...setGroupIds] } },
      select: {
        id: true,
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
    });

    if (setGroups.length !== setGroupIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing set group");
    }

    for (const g of setGroups) {
      if (g.segment.block.session.day.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references a set group from another plan", {
          setGroupId: g.id,
        });
      }
    }
  }

  if (entryIds.size > 0) {
    const entries = await tx.exerciseEntry.findMany({
      where: { id: { in: [...entryIds] } },
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

    if (entries.length !== entryIds.size) {
      throw new NotFoundError("Bulk-patch op references a missing entry");
    }

    for (const e of entries) {
      if (e.setGroup.segment.block.session.day.week.planId !== planId) {
        throw new NotFoundError("Bulk-patch op references an entry from another plan", {
          entryId: e.id,
        });
      }
    }
  }
};
