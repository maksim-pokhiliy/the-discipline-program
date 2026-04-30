import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

export const BULK_OP_CHUNK_LIMIT = 100;

export type BulkOpChunks = readonly (readonly BulkPatchOp[])[];

export const chunkBulkOps = (ops: readonly BulkPatchOp[]): BulkOpChunks => {
  if (ops.length === 0) {
    return [];
  }

  const chunks: BulkPatchOp[][] = [];

  for (let index = 0; index < ops.length; index += BULK_OP_CHUNK_LIMIT) {
    chunks.push(ops.slice(index, index + BULK_OP_CHUNK_LIMIT));
  }

  return chunks;
};

export const countOps = (chunks: BulkOpChunks): number => {
  let total = 0;

  for (const chunk of chunks) {
    total += chunk.length;
  }

  return total;
};
