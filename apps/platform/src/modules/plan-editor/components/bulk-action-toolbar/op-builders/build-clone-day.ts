import {
  type BulkPatchOp,
  type PlanStructureDay,
  type PlanStructureSession,
} from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type CloneDayTarget = {
  dayId: string;
  label: string;
  sessions: readonly PlanStructureSession[];
};

export type CloneDayInput = {
  source: PlanStructureDay;
  targets: readonly CloneDayTarget[];
};

export type CloneDayOpsResult = {
  chunks: BulkOpChunks;
  warnings: readonly string[];
};

export const buildCloneDayOps = ({ source, targets }: CloneDayInput): CloneDayOpsResult => {
  const ops: BulkPatchOp[] = [];
  const warnings: string[] = [];
  const orderBySession = new Map<string, number>();

  const nextOrder = (sessionId: string, initial: number): number => {
    const current = orderBySession.get(sessionId) ?? initial;

    orderBySession.set(sessionId, current + 1);

    return current;
  };

  for (const target of targets) {
    const targetSession = target.sessions[0];

    if (!targetSession) {
      warnings.push(`Day "${target.label}" has no session — skipped.`);
      continue;
    }

    const initialOrder = targetSession.blocks.reduce(
      (max, block) => Math.max(max, block.order + 1),
      0,
    );

    for (const sourceSession of source.sessions) {
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

  return { chunks: chunkBulkOps(ops), warnings };
};
