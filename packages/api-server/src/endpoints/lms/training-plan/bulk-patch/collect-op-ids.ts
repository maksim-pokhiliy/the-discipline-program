import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export type CollectedIds = {
  blockIds: Set<string>;
  segmentIds: Set<string>;
  entryIds: Set<string>;
  sessionIds: Set<string>;
  setGroupIds: Set<string>;
  weekIds: Set<string>;
  dayIds: Set<string>;
  planIds: Set<string>;
};

export const collectOpIds = (ops: BulkPatchOp[]): CollectedIds => {
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
