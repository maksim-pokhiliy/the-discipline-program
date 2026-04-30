import { Prisma } from "@prisma/client";

import { type BlockTemplatePayload } from "@repo/contracts/lms/_domain";

import { deriveExerciseSnapshot, type TxClient } from "../../../endpoints/lms/bulk-patch-apply-op";
import {
  BLOCK_STATUS_TO_PRISMA_MAP,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../../mappers/lms";

const toJsonInput = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const cloneBlockSubtree = async (
  tx: TxClient,
  payload: BlockTemplatePayload,
  target: { sessionId: string; order: number },
): Promise<{ blockId: string }> => {
  const block = await tx.block.create({
    data: {
      sessionId: target.sessionId,
      order: target.order,
      kindId: payload.block.kindId,
      title: payload.block.title,
      status: BLOCK_STATUS_TO_PRISMA_MAP[payload.block.status],
      weight: payload.block.weight,
      notes: payload.block.notes,
      version: 1,
    },
  });

  for (const segment of payload.segments) {
    const newSegment = await tx.blockSegment.create({
      data: {
        blockId: block.id,
        order: segment.order,
        label: segment.label,
        archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[segment.archetypeKind],
        schemeParams: toJsonInput(segment.schemeParams),
        schemeTemplateId: segment.schemeTemplateId,
        restConfig: segment.restConfig === null ? Prisma.JsonNull : toJsonInput(segment.restConfig),
        version: 1,
      },
    });

    for (const setGroup of segment.setGroups) {
      const newSetGroup = await tx.setGroup.create({
        data: {
          segmentId: newSegment.id,
          order: setGroup.order,
          label: setGroup.label,
          restConfig:
            setGroup.restConfig === null ? Prisma.JsonNull : toJsonInput(setGroup.restConfig),
        },
      });

      for (const entry of setGroup.entries) {
        const snapshot = await deriveExerciseSnapshot(tx, entry.exerciseId);

        await tx.exerciseEntry.create({
          data: {
            setGroupId: newSetGroup.id,
            order: entry.order,
            exerciseId: entry.exerciseId,
            exerciseSnapshot: toJsonInput(snapshot),
            prescription: toJsonInput(entry.prescription),
            alternatives: toJsonInput(entry.alternatives),
            externalUrl: entry.externalUrl,
            notes: entry.notes,
            version: 1,
          },
        });
      }
    }
  }

  return { blockId: block.id };
};
