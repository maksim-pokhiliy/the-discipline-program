import { type BulkPatchOp, type PlanStructureWeek } from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type ShiftWeeksInput = {
  weeks: readonly PlanStructureWeek[];
  destinationWeeks: readonly PlanStructureWeek[];
  delta: number;
};

export type ShiftWeeksResult = {
  chunks: BulkOpChunks;
  warnings: readonly string[];
};

export const buildShiftWeeksOps = ({
  weeks,
  destinationWeeks,
  delta,
}: ShiftWeeksInput): ShiftWeeksResult => {
  const ops: BulkPatchOp[] = [];
  const warnings: string[] = [];

  if (delta === 0) {
    return { chunks: [], warnings: ["Pick a non-zero delta to shift weeks."] };
  }

  if (weeks.length === 0) {
    return { chunks: [], warnings: ["Pick a source range to shift."] };
  }

  const destinationByIndex = new Map<number, PlanStructureWeek>(
    destinationWeeks.map((week) => [week.index, week] as const),
  );

  const orderBySession = new Map<string, number>();

  const nextOrder = (sessionId: string, initial: number): number => {
    const current = orderBySession.get(sessionId) ?? initial;

    orderBySession.set(sessionId, current + 1);

    return current;
  };

  for (const sourceWeek of weeks) {
    const destinationWeek = destinationByIndex.get(sourceWeek.index + delta);

    if (!destinationWeek) {
      warnings.push(
        `Week ${(sourceWeek.index + 1).toString()} cannot be shifted — destination week ${(sourceWeek.index + delta + 1).toString()} is outside the loaded range.`,
      );
      continue;
    }

    for (const sourceDay of sourceWeek.days) {
      const destinationDay = destinationWeek.days.find(
        (day) => day.dayOfWeek === sourceDay.dayOfWeek,
      );

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
            kind: "move-block",
            blockId: sourceBlock.id,
            expectedVersion: sourceBlock.version,
            targetSessionId: targetSession.id,
            targetOrder: nextOrder(targetSession.id, initialOrder),
          });
        }
      }
    }
  }

  return { chunks: chunkBulkOps(ops), warnings };
};
