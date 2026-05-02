import { Prisma } from "@prisma/client";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP } from "../../../../../mappers/lms";
import { findOrThrow, toInputJson } from "../../../../../utils";

import { type ApplyOutcome, type TxClient, readSegmentVersion } from "./shared";

type UpdateSegmentOp = Extract<BulkPatchOp, { kind: "update-segment" }>;
type MoveSegmentOp = Extract<BulkPatchOp, { kind: "move-segment" }>;
type CreateSegmentOp = Extract<BulkPatchOp, { kind: "create-segment" }>;
type DeleteSegmentOp = Extract<BulkPatchOp, { kind: "delete-segment" }>;

export const applyUpdateSegment = async (
  tx: TxClient,
  op: UpdateSegmentOp,
): Promise<ApplyOutcome> => {
  const result = await tx.blockSegment.updateMany({
    where: { id: op.segmentId, version: op.expectedVersion },
    data: {
      order: op.fullEntity.order,
      label: op.fullEntity.label,
      archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[op.fullEntity.archetypeKind],
      schemeParams: toInputJson(op.fullEntity.schemeParams),
      schemeTemplateId: op.fullEntity.schemeTemplateId,
      restConfig:
        op.fullEntity.restConfig === null ? Prisma.JsonNull : toInputJson(op.fullEntity.restConfig),
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readSegmentVersion(tx, op.segmentId) };
  }

  const segment = await findOrThrow(
    tx.blockSegment.findUnique({ where: { id: op.segmentId } }),
    "Block segment",
  );

  return { kind: "ok", segment };
};

export const applyMoveSegment = async (tx: TxClient, op: MoveSegmentOp): Promise<ApplyOutcome> => {
  const result = await tx.blockSegment.updateMany({
    where: { id: op.segmentId, version: op.expectedVersion },
    data: {
      blockId: op.targetBlockId,
      order: op.targetOrder,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readSegmentVersion(tx, op.segmentId) };
  }

  const segment = await findOrThrow(
    tx.blockSegment.findUnique({ where: { id: op.segmentId } }),
    "Block segment",
  );

  return { kind: "ok", segment };
};

export const applyCreateSegment = async (
  tx: TxClient,
  op: CreateSegmentOp,
): Promise<ApplyOutcome> => {
  const segment = await tx.blockSegment.create({
    data: {
      blockId: op.blockId,
      order: op.payload.order,
      label: op.payload.label ?? null,
      archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[op.payload.archetypeKind],
      schemeParams: toInputJson(op.payload.schemeParams),
      schemeTemplateId: op.payload.schemeTemplateId ?? null,
      restConfig:
        op.payload.restConfig === undefined ? Prisma.JsonNull : toInputJson(op.payload.restConfig),
    },
  });

  return { kind: "ok", segment };
};

export const applyDeleteSegment = async (
  tx: TxClient,
  op: DeleteSegmentOp,
): Promise<ApplyOutcome> => {
  const result = await tx.blockSegment.deleteMany({
    where: { id: op.segmentId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readSegmentVersion(tx, op.segmentId) };
  }

  return { kind: "ok" };
};
