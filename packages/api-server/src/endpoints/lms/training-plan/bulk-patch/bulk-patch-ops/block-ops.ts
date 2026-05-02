import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { BLOCK_STATUS_TO_PRISMA_MAP } from "../../../../../mappers/lms";
import { findOrThrow } from "../../../../../utils";

import { type ApplyOutcome, type TxClient, readBlockVersion } from "./shared";

type UpdateBlockOp = Extract<BulkPatchOp, { kind: "update-block" }>;
type MoveBlockOp = Extract<BulkPatchOp, { kind: "move-block" }>;
type CreateBlockOp = Extract<BulkPatchOp, { kind: "create-block" }>;
type DeleteBlockOp = Extract<BulkPatchOp, { kind: "delete-block" }>;

export const applyUpdateBlock = async (tx: TxClient, op: UpdateBlockOp): Promise<ApplyOutcome> => {
  const result = await tx.block.updateMany({
    where: { id: op.blockId, version: op.expectedVersion },
    data: {
      order: op.fullEntity.order,
      kindId: op.fullEntity.kindId,
      title: op.fullEntity.title,
      status: BLOCK_STATUS_TO_PRISMA_MAP[op.fullEntity.status],
      weight: op.fullEntity.weight,
      notes: op.fullEntity.notes,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readBlockVersion(tx, op.blockId) };
  }

  const block = await findOrThrow(tx.block.findUnique({ where: { id: op.blockId } }), "Block");

  return { kind: "ok", block };
};

export const applyMoveBlock = async (tx: TxClient, op: MoveBlockOp): Promise<ApplyOutcome> => {
  const result = await tx.block.updateMany({
    where: { id: op.blockId, version: op.expectedVersion },
    data: {
      sessionId: op.targetSessionId,
      order: op.targetOrder,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readBlockVersion(tx, op.blockId) };
  }

  const block = await findOrThrow(tx.block.findUnique({ where: { id: op.blockId } }), "Block");

  return { kind: "ok", block };
};

export const applyCreateBlock = async (tx: TxClient, op: CreateBlockOp): Promise<ApplyOutcome> => {
  const block = await tx.block.create({
    data: {
      sessionId: op.sessionId,
      order: op.payload.order,
      kindId: op.payload.kindId,
      title: op.payload.title ?? null,
      status: BLOCK_STATUS_TO_PRISMA_MAP[op.payload.status],
      weight: op.payload.weight,
      notes: op.payload.notes ?? null,
    },
  });

  return { kind: "ok", block };
};

export const applyDeleteBlock = async (tx: TxClient, op: DeleteBlockOp): Promise<ApplyOutcome> => {
  const result = await tx.block.deleteMany({
    where: { id: op.blockId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readBlockVersion(tx, op.blockId) };
  }

  return { kind: "ok" };
};
