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
        warnings.push(
          `Week ${(destination.index + 1).toString()} has no ${sourceDay.dayOfWeek} day — skipped.`,
        );
        continue;
      }

      const targetSession = destinationDay.sessions[0];

      if (!targetSession) {
        warnings.push(
          `Week ${(destination.index + 1).toString()} ${sourceDay.dayOfWeek} has no session — skipped.`,
        );
        continue;
      }

      const initialOrder = targetSession.blocks.reduce(
        (max, block) => Math.max(max, block.order + 1),
        0,
      );

      for (const sourceSession of sourceDay.sessions) {
        for (const sourceBlock of sourceSession.blocks) {
          ops.push({
            kind: "clone-block-subtree",
            sourceBlockId: sourceBlock.id,
            targetSessionId: targetSession.id,
            targetOrder: nextOrder(targetSession.id, initialOrder),
          });
        }
      }
    }
  }

  return { chunks: chunkBulkOps(ops), warnings };
};
