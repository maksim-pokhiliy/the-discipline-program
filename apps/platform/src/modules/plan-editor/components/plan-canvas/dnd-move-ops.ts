import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type DraggableInfo } from "./dnd-types";

export const buildMoveHistoryEntry = (
  active: DraggableInfo,
  forward: BulkPatchOp,
): { forward: BulkPatchOp[]; inverse: BulkPatchOp[] } | null => {
  if (active.kind === "block" && forward.kind === "move-block") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-block",
          blockId: active.blockId,
          expectedVersion: active.expectedVersion + 1,
          targetSessionId: active.sourceSessionId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  if (active.kind === "segment" && forward.kind === "move-segment") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-segment",
          segmentId: active.segmentId,
          expectedVersion: active.expectedVersion + 1,
          targetBlockId: active.sourceBlockId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  if (active.kind === "entry" && forward.kind === "move-entry") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-entry",
          entryId: active.entryId,
          expectedVersion: active.expectedVersion + 1,
          targetSetGroupId: active.sourceSetGroupId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  return null;
};

export const buildMoveOp = (
  active: DraggableInfo,
  targetContainerKey: string,
  targetIndex: number,
): BulkPatchOp | null => {
  const [targetType, targetId] = targetContainerKey.split(":");

  if (!targetId) {
    return null;
  }

  if (active.kind === "block" && targetType === "session") {
    return {
      kind: "move-block",
      blockId: active.blockId,
      expectedVersion: active.expectedVersion,
      targetSessionId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  if (active.kind === "segment" && targetType === "block-container") {
    return {
      kind: "move-segment",
      segmentId: active.segmentId,
      expectedVersion: active.expectedVersion,
      targetBlockId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  if (active.kind === "entry" && targetType === "setGroup") {
    return {
      kind: "move-entry",
      entryId: active.entryId,
      expectedVersion: active.expectedVersion,
      targetSetGroupId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  return null;
};
