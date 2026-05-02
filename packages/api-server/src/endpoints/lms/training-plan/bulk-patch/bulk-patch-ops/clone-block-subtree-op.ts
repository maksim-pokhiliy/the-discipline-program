import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { cloneExistingBlockSubtree } from "../../../../../services/lms/apply-template/clone-existing-block-subtree";
import { findOrThrow } from "../../../../../utils";

import { type ApplyOutcome, type TxClient } from "./shared";

type CloneBlockSubtreeOp = Extract<BulkPatchOp, { kind: "clone-block-subtree" }>;

export const applyCloneBlockSubtree = async (
  tx: TxClient,
  op: CloneBlockSubtreeOp,
): Promise<ApplyOutcome> => {
  const { blockId } = await cloneExistingBlockSubtree(tx, op.sourceBlockId, {
    sessionId: op.targetSessionId,
    order: op.targetOrder,
  });

  const block = await findOrThrow(tx.block.findUnique({ where: { id: blockId } }), "Block");

  return { kind: "ok", block };
};
