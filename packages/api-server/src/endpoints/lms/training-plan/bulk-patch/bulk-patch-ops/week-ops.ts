import { DayOfWeek, type Prisma } from "@prisma/client";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { findOrThrow } from "../../../../../utils";

import { type ApplyOutcome, type TxClient } from "./shared";

type CreateWeekOp = Extract<BulkPatchOp, { kind: "create-week" }>;
type UpdateWeekOp = Extract<BulkPatchOp, { kind: "update-week" }>;
type DeleteWeekOp = Extract<BulkPatchOp, { kind: "delete-week" }>;

const ALL_DAYS_OF_WEEK = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
] as const;

const readWeekVersion = async (tx: TxClient, weekId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.week.findUnique({ where: { id: weekId }, select: { version: true } }),
    "Week",
  );

  return row.version;
};

export const applyCreateWeek = async (tx: TxClient, op: CreateWeekOp): Promise<ApplyOutcome> => {
  await tx.week.create({
    data: {
      planId: op.planId,
      index: op.payload.index,
      label: op.payload.label ?? null,
      notes: op.payload.notes ?? null,
      days: {
        create: ALL_DAYS_OF_WEEK.map((dayOfWeek) => ({ dayOfWeek })),
      },
    },
    select: { id: true },
  });

  return { kind: "ok" };
};

const buildWeekUpdateData = (
  fullEntity: UpdateWeekOp["fullEntity"],
): Prisma.WeekUpdateManyMutationInput => {
  const data: Prisma.WeekUpdateManyMutationInput = { version: { increment: 1 } };

  if (fullEntity.index !== undefined) {
    data.index = fullEntity.index;
  }

  if (fullEntity.label !== undefined) {
    data.label = fullEntity.label;
  }

  if (fullEntity.notes !== undefined) {
    data.notes = fullEntity.notes;
  }

  return data;
};

export const applyUpdateWeek = async (tx: TxClient, op: UpdateWeekOp): Promise<ApplyOutcome> => {
  const result = await tx.week.updateMany({
    where: { id: op.weekId, version: op.expectedVersion },
    data: buildWeekUpdateData(op.fullEntity),
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readWeekVersion(tx, op.weekId) };
  }

  return { kind: "ok" };
};

export const applyDeleteWeek = async (tx: TxClient, op: DeleteWeekOp): Promise<ApplyOutcome> => {
  const result = await tx.week.deleteMany({
    where: { id: op.weekId, version: op.expectedVersion },
  });

  if (result.count === 0) {
    return { kind: "conflict", currentVersion: await readWeekVersion(tx, op.weekId) };
  }

  return { kind: "ok" };
};
