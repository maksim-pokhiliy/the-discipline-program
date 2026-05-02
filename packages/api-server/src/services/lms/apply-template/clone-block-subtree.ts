import { Prisma } from "@prisma/client";

import { type BlockTemplatePayload, type ExerciseSnapshot } from "@repo/contracts/lms/_domain";

import { type TxClient } from "../../../db/tx";
import {
  BLOCK_STATUS_TO_PRISMA_MAP,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../../mappers/lms";
import { toInputJson } from "../../../utils";
import { buildExerciseSnapshotMap } from "../derive-exercise-snapshot";

export const collectBlockExerciseIds = (payload: BlockTemplatePayload): string[] => {
  const ids: string[] = [];

  for (const segment of payload.segments) {
    for (const setGroup of segment.setGroups) {
      for (const entry of setGroup.entries) {
        ids.push(entry.exerciseId);
      }
    }
  }

  return ids;
};

export const buildBlockCreateWithoutSessionInput = (
  payload: BlockTemplatePayload,
  snapshotMap: Map<string, ExerciseSnapshot>,
  order: number,
): Prisma.BlockUncheckedCreateWithoutSessionInput => ({
  order,
  kindId: payload.block.kindId,
  title: payload.block.title,
  status: BLOCK_STATUS_TO_PRISMA_MAP[payload.block.status],
  weight: payload.block.weight,
  notes: payload.block.notes,
  version: 1,
  segments: {
    create: payload.segments.map((segment) => ({
      order: segment.order,
      label: segment.label,
      archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[segment.archetypeKind],
      schemeParams: toInputJson(segment.schemeParams),
      schemeTemplateId: segment.schemeTemplateId,
      restConfig: segment.restConfig === null ? Prisma.JsonNull : toInputJson(segment.restConfig),
      version: 1,
      setGroups: {
        create: segment.setGroups.map((setGroup) => ({
          order: setGroup.order,
          label: setGroup.label,
          restConfig:
            setGroup.restConfig === null ? Prisma.JsonNull : toInputJson(setGroup.restConfig),
          entries: {
            create: setGroup.entries.map((entry) => {
              const snapshot = snapshotMap.get(entry.exerciseId);

              if (!snapshot) {
                throw new Error(`Exercise ${entry.exerciseId} not found for snapshot`);
              }

              return {
                order: entry.order,
                exerciseId: entry.exerciseId,
                exerciseSnapshot: toInputJson(snapshot),
                prescription: toInputJson(entry.prescription),
                alternatives: toInputJson(entry.alternatives),
                externalUrl: entry.externalUrl,
                notes: entry.notes,
                version: 1,
              };
            }),
          },
        })),
      },
    })),
  },
});

export const cloneBlockSubtree = async (
  tx: TxClient,
  payload: BlockTemplatePayload,
  target: { sessionId: string; order: number },
): Promise<{ blockId: string }> => {
  const snapshotMap = await buildExerciseSnapshotMap(tx, collectBlockExerciseIds(payload));
  const block = await tx.block.create({
    data: {
      sessionId: target.sessionId,
      ...buildBlockCreateWithoutSessionInput(payload, snapshotMap, target.order),
    },
  });

  return { blockId: block.id };
};
