import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { deriveExerciseSnapshot } from "../../../../services/lms/derive-exercise-snapshot";

import {
  type ApplyOutcome,
  type TxClient,
  applyCloneBlockSubtree,
  applyCreateBlock,
  applyCreateDay,
  applyCreateEntry,
  applyCreateSegment,
  applyCreateSession,
  applyCreateWeek,
  applyDeleteBlock,
  applyDeleteDay,
  applyDeleteEntry,
  applyDeleteSegment,
  applyDeleteSession,
  applyDeleteWeek,
  applyMoveBlock,
  applyMoveEntry,
  applyMoveSegment,
  applyUpdateBlock,
  applyUpdateDay,
  applyUpdateEntry,
  applyUpdateSegment,
  applyUpdateSession,
  applyUpdateWeek,
} from "./bulk-patch-ops";

export { deriveExerciseSnapshot };
export type { ApplyOutcome, TxClient };

export const applyOpInTx = async (
  tx: TxClient,
  op: BulkPatchOp,
  snapshotMap?: Map<string, ExerciseSnapshot>,
): Promise<ApplyOutcome> => {
  switch (op.kind) {
    case "update-block":
      return applyUpdateBlock(tx, op);
    case "update-segment":
      return applyUpdateSegment(tx, op);
    case "update-entry":
      return applyUpdateEntry(tx, op, snapshotMap);
    case "move-block":
      return applyMoveBlock(tx, op);
    case "move-segment":
      return applyMoveSegment(tx, op);
    case "move-entry":
      return applyMoveEntry(tx, op);
    case "create-block":
      return applyCreateBlock(tx, op);
    case "create-segment":
      return applyCreateSegment(tx, op);
    case "create-entry":
      return applyCreateEntry(tx, op, snapshotMap);
    case "delete-block":
      return applyDeleteBlock(tx, op);
    case "delete-segment":
      return applyDeleteSegment(tx, op);
    case "delete-entry":
      return applyDeleteEntry(tx, op);
    case "clone-block-subtree":
      return applyCloneBlockSubtree(tx, op);
    case "create-week":
      return applyCreateWeek(tx, op);
    case "update-week":
      return applyUpdateWeek(tx, op);
    case "delete-week":
      return applyDeleteWeek(tx, op);
    case "create-day":
      return applyCreateDay(tx, op);
    case "update-day":
      return applyUpdateDay(tx, op);
    case "delete-day":
      return applyDeleteDay(tx, op);
    case "create-session":
      return applyCreateSession(tx, op);
    case "update-session":
      return applyUpdateSession(tx, op);
    case "delete-session":
      return applyDeleteSession(tx, op);
  }
};
