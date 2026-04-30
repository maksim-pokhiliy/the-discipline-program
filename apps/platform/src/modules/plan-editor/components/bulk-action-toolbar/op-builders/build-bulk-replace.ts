import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { type BulkPatchOp, type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { findEntryById } from "../../inspector/use-selected-entities";

import { type BulkOpChunks, chunkBulkOps } from "./chunk";

const buildExerciseSnapshot = (item: ExerciseLibraryItem): ExerciseSnapshot => ({
  id: item.id,
  name: item.name,
  primaryMovement: item.primaryMovement,
  modality: item.modality,
  primaryBodyParts: item.primaryBodyParts,
  defaultMetrics: item.defaultMetrics,
  demoVideoUrl: item.demoVideoUrl,
  demoImageUrl: item.demoImageUrl,
});

export type BulkReplaceTarget = {
  entryId: string;
  segment: PlanStructureSegment;
};

export type BulkReplaceInput = {
  targets: readonly BulkReplaceTarget[];
  replacement: ExerciseLibraryItem;
};

export const buildBulkReplaceOps = ({ targets, replacement }: BulkReplaceInput): BulkOpChunks => {
  const ops: BulkPatchOp[] = [];
  const snapshot = buildExerciseSnapshot(replacement);

  for (const target of targets) {
    const found = target.segment.setGroups
      .flatMap((sg) => sg.entries)
      .find((entry) => entry.id === target.entryId);

    if (!found) {
      continue;
    }

    ops.push({
      kind: "update-entry",
      entryId: found.id,
      expectedVersion: found.version,
      fullEntity: {
        order: found.order,
        exerciseId: replacement.id,
        exerciseSnapshot: snapshot,
        prescription: found.prescription,
        alternatives: found.alternatives,
        externalUrl: found.externalUrl,
        notes: found.notes,
      },
    });
  }

  return chunkBulkOps(ops);
};

export const collectReplaceTargets = (
  data: Parameters<typeof findEntryById>[0],
  entryIds: readonly string[],
): BulkReplaceTarget[] => {
  const result: BulkReplaceTarget[] = [];

  for (const entryId of entryIds) {
    const found = findEntryById(data, entryId);

    if (!found) {
      continue;
    }

    result.push({ entryId, segment: found.segment });
  }

  return result;
};
