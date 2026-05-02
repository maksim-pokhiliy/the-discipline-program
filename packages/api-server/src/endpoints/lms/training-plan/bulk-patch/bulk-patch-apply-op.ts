import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { deriveExerciseSnapshot } from "../../../../services/lms/derive-exercise-snapshot";

import {
  type ApplyOutcome,
  type TxClient,
  applyCloneBlockSubtree,
  applyCreateBlock,
  applyCreateEntry,
  applyCreateSegment,
  applyDeleteBlock,
  applyDeleteEntry,
  applyDeleteSegment,
  applyMoveBlock,
  applyMoveEntry,
  applyMoveSegment,
  applyUpdateBlock,
  applyUpdateEntry,
  applyUpdateSegment,
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
  }
};
