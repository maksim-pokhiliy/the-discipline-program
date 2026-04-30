import { Prisma } from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { type TxClient } from "../../../db/tx";
import { toInputJson } from "../../../utils";
import { deriveExerciseSnapshot } from "../derive-exercise-snapshot";

export const cloneExistingBlockSubtree = async (
  tx: TxClient,
  sourceBlockId: string,
  target: { sessionId: string; order: number },
): Promise<{ blockId: string }> => {
  const source = await tx.block.findUnique({
    where: { id: sourceBlockId },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          setGroups: {
            orderBy: { order: "asc" },
            include: {
              entries: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!source) {
    throw new NotFoundError("Source block not found", { blockId: sourceBlockId });
  }

  const block = await tx.block.create({
    data: {
      sessionId: target.sessionId,
      order: target.order,
      kindId: source.kindId,
      title: source.title,
      status: source.status,
      weight: source.weight,
      notes: source.notes,
      version: 1,
    },
  });

  for (const segment of source.segments) {
    const newSegment = await tx.blockSegment.create({
      data: {
        blockId: block.id,
        order: segment.order,
        label: segment.label,
        archetypeKind: segment.archetypeKind,
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
