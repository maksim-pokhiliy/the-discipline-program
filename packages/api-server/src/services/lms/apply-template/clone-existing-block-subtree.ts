import { Prisma } from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { type TxClient } from "../../../db/tx";
import { toInputJson } from "../../../utils";
import { buildExerciseSnapshotMap } from "../derive-exercise-snapshot";

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

  const exerciseIds = source.segments.flatMap((segment) =>
    segment.setGroups.flatMap((setGroup) => setGroup.entries.map((entry) => entry.exerciseId)),
  );
  const snapshotMap = await buildExerciseSnapshotMap(tx, exerciseIds);

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
      segments: {
        create: source.segments.map((segment) => ({
          order: segment.order,
          label: segment.label,
          archetypeKind: segment.archetypeKind,
          schemeParams: toInputJson(segment.schemeParams),
          schemeTemplateId: segment.schemeTemplateId,
          restConfig:
            segment.restConfig === null ? Prisma.JsonNull : toInputJson(segment.restConfig),
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
    },
  });

  return { blockId: block.id };
};
