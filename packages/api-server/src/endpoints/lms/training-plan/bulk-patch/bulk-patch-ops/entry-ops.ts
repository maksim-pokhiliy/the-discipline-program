import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { findOrThrow, toInputJson } from "../../../../../utils";

import { type ApplyOutcome, type TxClient, readEntryVersion, resolveSnapshot } from "./shared";

type UpdateEntryOp = Extract<BulkPatchOp, { kind: "update-entry" }>;
type MoveEntryOp = Extract<BulkPatchOp, { kind: "move-entry" }>;
type CreateEntryOp = Extract<BulkPatchOp, { kind: "create-entry" }>;
type DeleteEntryOp = Extract<BulkPatchOp, { kind: "delete-entry" }>;

export const applyUpdateEntry = async (
  tx: TxClient,
  op: UpdateEntryOp,
  snapshotMap: Map<string, ExerciseSnapshot> | undefined,
): Promise<ApplyOutcome> => {
  const serverSnapshot = await resolveSnapshot(tx, op.fullEntity.exerciseId, snapshotMap);

  const result = await tx.exerciseEntry.updateMany({
    where: { id: op.entryId, version: op.expectedVersion },
    data: {
      order: op.fullEntity.order,
      exerciseId: op.fullEntity.exerciseId,
      exerciseSnapshot: toInputJson(serverSnapshot),
      prescription: toInputJson(op.fullEntity.prescription),
      alternatives: toInputJson(op.fullEntity.alternatives),
      externalUrl: op.fullEntity.externalUrl,
      notes: op.fullEntity.notes,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readEntryVersion(tx, op.entryId) };
  }

  const entry = await findOrThrow(
    tx.exerciseEntry.findUnique({ where: { id: op.entryId } }),
    "Exercise entry",
  );

  return { kind: "ok", entry };
};

export const applyMoveEntry = async (tx: TxClient, op: MoveEntryOp): Promise<ApplyOutcome> => {
  const result = await tx.exerciseEntry.updateMany({
    where: { id: op.entryId, version: op.expectedVersion },
    data: {
      setGroupId: op.targetSetGroupId,
      order: op.targetOrder,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readEntryVersion(tx, op.entryId) };
  }

  const entry = await findOrThrow(
    tx.exerciseEntry.findUnique({ where: { id: op.entryId } }),
    "Exercise entry",
  );

  return { kind: "ok", entry };
};

export const applyCreateEntry = async (
  tx: TxClient,
  op: CreateEntryOp,
  snapshotMap: Map<string, ExerciseSnapshot> | undefined,
): Promise<ApplyOutcome> => {
  const serverSnapshot = await resolveSnapshot(tx, op.payload.exerciseId, snapshotMap);

  const entry = await tx.exerciseEntry.create({
    data: {
      setGroupId: op.setGroupId,
      order: op.payload.order,
      exerciseId: op.payload.exerciseId,
      exerciseSnapshot: toInputJson(serverSnapshot),
      prescription: toInputJson(op.payload.prescription),
      alternatives: toInputJson(op.payload.alternatives),
      externalUrl: op.payload.externalUrl ?? null,
      notes: op.payload.notes ?? null,
    },
  });

  return { kind: "ok", entry };
};

export const applyDeleteEntry = async (tx: TxClient, op: DeleteEntryOp): Promise<ApplyOutcome> => {
  const result = await tx.exerciseEntry.deleteMany({
    where: { id: op.entryId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readEntryVersion(tx, op.entryId) };
  }

  return { kind: "ok" };
};
