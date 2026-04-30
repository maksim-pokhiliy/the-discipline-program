import {
  type BulkPatchOp,
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSegment,
  type PlanStructureSession,
} from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type CloneDayTarget = {
  dayId: string;
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

const buildCreateBlockOp = (
  sourceBlock: PlanStructureBlock,
  targetSessionId: string,
  baseOrder: number,
): BulkPatchOp => ({
  kind: "create-block",
  sessionId: targetSessionId,
  payload: {
    order: baseOrder + sourceBlock.order,
    kindId: sourceBlock.kindId,
    title: sourceBlock.title ?? undefined,
    status: sourceBlock.status,
    weight: sourceBlock.weight,
    notes: sourceBlock.notes ?? undefined,
  },
});

const collectEntryWarnings = (segment: PlanStructureSegment): boolean => {
  return segment.setGroups.some((sg) => sg.entries.length > 0);
};

export const buildCloneDayOps = ({ source, targets }: CloneDayInput): CloneDayOpsResult => {
  const ops: BulkPatchOp[] = [];
  const warnings: string[] = [];
  let entriesSkipped = false;

  for (const target of targets) {
    const targetSession = target.sessions[0];

    if (!targetSession) {
      continue;
    }

    const baseOrder = targetSession.blocks.reduce(
      (max, block) => Math.max(max, block.order + 1),
      0,
    );

    for (const sourceSession of source.sessions) {
      for (const sourceBlock of sourceSession.blocks) {
        ops.push(buildCreateBlockOp(sourceBlock, targetSession.id, baseOrder));

        for (const segment of sourceBlock.segments) {
          if (collectEntryWarnings(segment)) {
            entriesSkipped = true;
          }
        }
      }
    }
  }

  if (entriesSkipped) {
    warnings.push(
      "Cloning copies blocks only — segments, set groups and entries cannot be cloned via the bulk-patch API. After the new blocks appear, drag a template or recreate segments manually.",
    );
  }

  return { chunks: chunkBulkOps(ops), warnings };
};
