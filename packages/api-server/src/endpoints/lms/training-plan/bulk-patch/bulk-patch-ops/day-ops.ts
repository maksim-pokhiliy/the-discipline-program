import { type Prisma } from "@prisma/client";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { findOrThrow } from "../../../../../utils";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateDayOp = Extract<BulkPatchOp, { kind: "create-day" }>;
type UpdateDayOp = Extract<BulkPatchOp, { kind: "update-day" }>;
type DeleteDayOp = Extract<BulkPatchOp, { kind: "delete-day" }>;

const readDayVersion = async (tx: TxClient, dayId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.day.findUnique({ where: { id: dayId }, select: { version: true } }),
    "Day",
  );

  return row.version;
};

export const applyCreateDay = async (tx: TxClient, op: CreateDayOp): Promise<ApplyOutcome> => {
  await tx.day.create({
    data: {
      weekId: op.weekId,
      dayOfWeek: op.payload.dayOfWeek,
      kind: op.payload.kind ?? "TRAINING",
      notes: op.payload.notes ?? null,
    },
    select: { id: true },
  });

  return { kind: "ok" };
};

const buildDayUpdateData = (
  fullEntity: UpdateDayOp["fullEntity"],
): Prisma.DayUpdateManyMutationInput => {
  const data: Prisma.DayUpdateManyMutationInput = { version: { increment: 1 } };

  if (fullEntity.kind !== undefined) {
    data.kind = fullEntity.kind;
  }

  if (fullEntity.notes !== undefined) {
    data.notes = fullEntity.notes;
  }

  return data;
};

export const applyUpdateDay = async (tx: TxClient, op: UpdateDayOp): Promise<ApplyOutcome> => {
  const result = await tx.day.updateMany({
    where: { id: op.dayId, version: op.expectedVersion },
    data: buildDayUpdateData(op.fullEntity),
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readDayVersion(tx, op.dayId) };
  }

  return { kind: "ok" };
};

export const applyDeleteDay = async (tx: TxClient, op: DeleteDayOp): Promise<ApplyOutcome> => {
  const result = await tx.day.deleteMany({
    where: { id: op.dayId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readDayVersion(tx, op.dayId) };
  }

  return { kind: "ok" };
};
