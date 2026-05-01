import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
  Prisma,
} from "@prisma/client";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type TxClient } from "../../../../db/tx";
import {
  BLOCK_STATUS_TO_PRISMA_MAP,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../../../mappers/lms";
import { cloneExistingBlockSubtree } from "../../../../services/lms/apply-template/clone-existing-block-subtree";
import { deriveExerciseSnapshot } from "../../../../services/lms/derive-exercise-snapshot";
import { findOrThrow, toInputJson } from "../../../../utils";

export { deriveExerciseSnapshot };
export type { TxClient };

export type ApplyOutcome =
  | {
      kind: "ok";
      block?: PrismaBlock;
      segment?: PrismaBlockSegment;
      entry?: PrismaExerciseEntry;
    }
  | { kind: "conflict"; currentVersion: number };

const readBlockVersion = async (tx: TxClient, blockId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.block.findUnique({ where: { id: blockId }, select: { version: true } }),
    "Block",
  );

  return row.version;
};

const readSegmentVersion = async (tx: TxClient, segmentId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.blockSegment.findUnique({ where: { id: segmentId }, select: { version: true } }),
    "Block segment",
  );

  return row.version;
};

const readEntryVersion = async (tx: TxClient, entryId: string): Promise<number> => {
  const row = await findOrThrow(
    tx.exerciseEntry.findUnique({ where: { id: entryId }, select: { version: true } }),
    "Exercise entry",
  );

  return row.version;
};

export const applyOpInTx = async (tx: TxClient, op: BulkPatchOp): Promise<ApplyOutcome> => {
  switch (op.kind) {
    case "update-block": {
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
    }

    case "update-segment": {
      const result = await tx.blockSegment.updateMany({
        where: { id: op.segmentId, version: op.expectedVersion },
        data: {
          order: op.fullEntity.order,
          label: op.fullEntity.label,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[op.fullEntity.archetypeKind],
          schemeParams: toInputJson(op.fullEntity.schemeParams),
          schemeTemplateId: op.fullEntity.schemeTemplateId,
          restConfig:
            op.fullEntity.restConfig === null
              ? Prisma.JsonNull
              : toInputJson(op.fullEntity.restConfig),
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
    }

    case "update-entry": {
      const serverSnapshot = await deriveExerciseSnapshot(tx, op.fullEntity.exerciseId);

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
    }

    case "move-block": {
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
    }

    case "move-segment": {
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
    }

    case "move-entry": {
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
    }

    case "create-block": {
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
    }

    case "create-segment": {
      const segment = await tx.blockSegment.create({
        data: {
          blockId: op.blockId,
          order: op.payload.order,
          label: op.payload.label ?? null,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[op.payload.archetypeKind],
          schemeParams: toInputJson(op.payload.schemeParams),
          schemeTemplateId: op.payload.schemeTemplateId ?? null,
          restConfig:
            op.payload.restConfig === undefined
              ? Prisma.JsonNull
              : toInputJson(op.payload.restConfig),
        },
      });

      return { kind: "ok", segment };
    }

    case "create-entry": {
      const serverSnapshot = await deriveExerciseSnapshot(tx, op.payload.exerciseId);

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
    }

    case "delete-block": {
      const result = await tx.block.deleteMany({
        where: { id: op.blockId, version: op.expectedVersion },
      });

      if (result.count === 0) {
        return { kind: "conflict", currentVersion: await readBlockVersion(tx, op.blockId) };
      }

      return { kind: "ok" };
    }

    case "delete-segment": {
      const result = await tx.blockSegment.deleteMany({
        where: { id: op.segmentId, version: op.expectedVersion },
      });

      if (result.count === 0) {
        return { kind: "conflict", currentVersion: await readSegmentVersion(tx, op.segmentId) };
      }

      return { kind: "ok" };
    }

    case "delete-entry": {
      const result = await tx.exerciseEntry.deleteMany({
        where: { id: op.entryId, version: op.expectedVersion },
      });

      if (result.count === 0) {
        return { kind: "conflict", currentVersion: await readEntryVersion(tx, op.entryId) };
      }

      return { kind: "ok" };
    }

    case "clone-block-subtree": {
      const { blockId } = await cloneExistingBlockSubtree(tx, op.sourceBlockId, {
        sessionId: op.targetSessionId,
        order: op.targetOrder,
      });

      const block = await findOrThrow(tx.block.findUnique({ where: { id: blockId } }), "Block");

      return { kind: "ok", block };
    }
  }
};
