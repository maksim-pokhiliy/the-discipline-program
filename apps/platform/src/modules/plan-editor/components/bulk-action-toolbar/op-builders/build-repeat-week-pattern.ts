import { type BulkPatchOp, type PlanStructureWeek } from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type RepeatWeekPatternInput = {
  sourceWeeks: readonly PlanStructureWeek[];
  destinationWeeks: readonly PlanStructureWeek[];
};

export type RepeatWeekPatternResult = {
  chunks: BulkOpChunks;
  warnings: readonly string[];
};

export const buildRepeatWeekPatternOps = ({
  sourceWeeks,
  destinationWeeks,
}: RepeatWeekPatternInput): RepeatWeekPatternResult => {
  const ops: BulkPatchOp[] = [];
  const warnings: string[] = [];

  if (sourceWeeks.length === 0 || destinationWeeks.length === 0) {
    return { chunks: [], warnings: ["Pick a source range and a destination range to repeat."] };
  }

  const orderBySession = new Map<string, number>();
  let entriesSkipped = false;

  const nextOrder = (sessionId: string, initial: number): number => {
    const current = orderBySession.get(sessionId) ?? initial;

    orderBySession.set(sessionId, current + 1);

    return current;
  };

  for (let i = 0; i < destinationWeeks.length; i += 1) {
    const destination = destinationWeeks[i];

    if (!destination) {
      continue;
    }

    const source = sourceWeeks[i % sourceWeeks.length];

    if (!source) {
      continue;
    }

    for (const sourceDay of source.days) {
      const destinationDay = destination.days.find((day) => day.dayOfWeek === sourceDay.dayOfWeek);

      if (!destinationDay) {
        continue;
      }

      const targetSession = destinationDay.sessions[0];

      if (!targetSession) {
        continue;
      }

      const initialOrder = targetSession.blocks.reduce(
        (max, block) => Math.max(max, block.order + 1),
        0,
      );

      for (const sourceSession of sourceDay.sessions) {
        for (const sourceBlock of sourceSession.blocks) {
          ops.push({
            kind: "create-block",
            sessionId: targetSession.id,
            payload: {
              order: nextOrder(targetSession.id, initialOrder),
              kindId: sourceBlock.kindId,
              title: sourceBlock.title ?? undefined,
              status: sourceBlock.status,
              weight: sourceBlock.weight,
              notes: sourceBlock.notes ?? undefined,
            },
          });

          for (const segment of sourceBlock.segments) {
            if (segment.setGroups.some((sg) => sg.entries.length > 0)) {
              entriesSkipped = true;
            }
          }
        }
      }
    }
  }

  if (entriesSkipped) {
    warnings.push(
      "Repeat copies blocks only — segments, set groups and entries cannot be cloned via the bulk-patch API. Add segments manually or apply a template after the blocks appear.",
    );
  }

  return { chunks: chunkBulkOps(ops), warnings };
};
