import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
} from "@prisma/client";

import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";

import { type TxClient } from "../../../../../db/tx";
import { deriveExerciseSnapshot } from "../../../../../services/lms/derive-exercise-snapshot";
import { findOrThrow } from "../../../../../utils";

export type { TxClient };

export type ApplyOutcome =
  | {
      kind: "ok";
      block?: PrismaBlock;
      segment?: PrismaBlockSegment;
      entry?: PrismaExerciseEntry;
    }
  | { kind: "conflict"; currentVersion: number };

export const resolveSnapshot = async (
  tx: TxClient,
  exerciseId: string,
  snapshotMap: Map<string, ExerciseSnapshot> | undefined,
): Promise<ExerciseSnapshot> => {
  const cached = snapshotMap?.get(exerciseId);

  if (cached) {
    return cached;
  }

  return deriveExerciseSnapshot(tx, exerciseId);
};

export const readBlockVersion = async (tx: TxClient, blockId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.block.findUnique({ where: { id: blockId }, select: { version: true } }),
    "Block",
  );

  return row.version;
};

export const readSegmentVersion = async (tx: TxClient, segmentId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.blockSegment.findUnique({ where: { id: segmentId }, select: { version: true } }),
    "Block segment",
  );

  return row.version;
};

export const readEntryVersion = async (tx: TxClient, entryId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.exerciseEntry.findUnique({ where: { id: entryId }, select: { version: true } }),
    "Exercise entry",
  );

  return row.version;
};
