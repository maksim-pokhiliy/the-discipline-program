import { type BulkPatchOp, type PlanStructureBlock } from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

export type BulkSuspendInput = {
  blocks: readonly PlanStructureBlock[];
  suspended: boolean;
};

export const buildBulkSuspendOps = ({ blocks, suspended }: BulkSuspendInput): BulkOpChunks => {
  const status = suspended ? "SUSPENDED" : "ACTIVE";

  const ops: BulkPatchOp[] = blocks.map((block) => ({
    kind: "update-block",
    blockId: block.id,
    expectedVersion: block.version,
    fullEntity: {
      order: block.order,
      kindId: block.kindId,
      title: block.title,
      status,
      weight: block.weight,
      notes: block.notes,
    },
  }));

  return chunkBulkOps(ops);
};
