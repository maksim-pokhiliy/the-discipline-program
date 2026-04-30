import { Prisma } from "@prisma/client";

import { type BlockTemplatePayload } from "@repo/contracts/lms/_domain";

import { type TxClient } from "../../../db/tx";
import {
  BLOCK_STATUS_TO_PRISMA_MAP,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
} from "../../../mappers/lms";
import { toInputJson } from "../../../utils";
import { deriveExerciseSnapshot } from "../derive-exercise-snapshot";

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
        schemeParams: toInputJson(segment.schemeParams),
        schemeTemplateId: segment.schemeTemplateId,
        restConfig: segment.restConfig === null ? Prisma.JsonNull : toInputJson(segment.restConfig),
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
            setGroup.restConfig === null ? Prisma.JsonNull : toInputJson(setGroup.restConfig),
        },
      });

      for (const entry of setGroup.entries) {
        const snapshot = await deriveExerciseSnapshot(tx, entry.exerciseId);

        await tx.exerciseEntry.create({
          data: {
            setGroupId: newSetGroup.id,
            order: entry.order,
            exerciseId: entry.exerciseId,
            exerciseSnapshot: toInputJson(snapshot),
            prescription: toInputJson(entry.prescription),
            alternatives: toInputJson(entry.alternatives),
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
