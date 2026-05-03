import { type Prisma } from "@prisma/client";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { findOrThrow } from "../../../../../utils";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateSessionOp = Extract<BulkPatchOp, { kind: "create-session" }>;
type UpdateSessionOp = Extract<BulkPatchOp, { kind: "update-session" }>;
type DeleteSessionOp = Extract<BulkPatchOp, { kind: "delete-session" }>;

const readSessionVersion = async (tx: TxClient, sessionId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.lmsSession.findUnique({ where: { id: sessionId }, select: { version: true } }),
    "Session",
  );

  return row.version;
};

const resolveCreateOrder = async (
  tx: TxClient,
  dayId: string,
  explicitOrder: number | undefined,
): Promise<number> => {
  if (explicitOrder !== undefined) {
    return explicitOrder;
  }

  const aggregate = await tx.lmsSession.aggregate({
    where: { dayId },
    _max: { order: true },
  });

  return (aggregate._max.order ?? -1) + 1;
};

export const applyCreateSession = async (
  tx: TxClient,
  op: CreateSessionOp,
): Promise<ApplyOutcome> => {
  const order = await resolveCreateOrder(tx, op.dayId, op.payload.order);

  await tx.lmsSession.create({
    data: {
      dayId: op.dayId,
      order,
      label: op.payload.label ?? null,
      notes: op.payload.notes ?? null,
    },
    select: { id: true },
  });

  return { kind: "ok" };
};

const buildSessionUpdateData = (
  fullEntity: UpdateSessionOp["fullEntity"],
): Prisma.LmsSessionUpdateManyMutationInput => {
  const data: Prisma.LmsSessionUpdateManyMutationInput = { version: { increment: 1 } };

  if (fullEntity.order !== undefined) {
    data.order = fullEntity.order;
  }

  if (fullEntity.label !== undefined) {
    data.label = fullEntity.label;
  }

  if (fullEntity.notes !== undefined) {
    data.notes = fullEntity.notes;
  }

  return data;
};

export const applyUpdateSession = async (
  tx: TxClient,
  op: UpdateSessionOp,
): Promise<ApplyOutcome> => {
  const result = await tx.lmsSession.updateMany({
    where: { id: op.sessionId, version: op.expectedVersion },
    data: buildSessionUpdateData(op.fullEntity),
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readSessionVersion(tx, op.sessionId) };
  }

  return { kind: "ok" };
};

export const applyDeleteSession = async (
  tx: TxClient,
  op: DeleteSessionOp,
): Promise<ApplyOutcome> => {
  const result = await tx.lmsSession.deleteMany({
    where: { id: op.sessionId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readSessionVersion(tx, op.sessionId) };
  }

  return { kind: "ok" };
};
