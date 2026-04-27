"use client";

import { useCallback } from "react";

import { type Block, type BlockSegment, type ExerciseEntry } from "@repo/contracts/lms";
import { type BulkPatchOp, pickConflictCurrentVersion } from "@repo/contracts/lms/training-plan";
import { ConflictError } from "@repo/errors";

import { api } from "@app/lib/api";

export const useBlockBulkPatchUpdate = (planId: string, blockId: string) => {
  return useCallback(
    async (draft: Block, expectedVersion: number): Promise<Block> => {
      const op: BulkPatchOp = {
        kind: "update-block",
        blockId,
        expectedVersion,
        fullEntity: {
          order: draft.order,
          kindId: draft.kindId,
          title: draft.title,
          status: draft.status,
          weight: draft.weight,
          notes: draft.notes,
        },
      };

      const result = await api.planBulkPatch.patch(planId, { ops: [op] });

      if (result.conflicts && result.conflicts.length > 0) {
        throw new ConflictError("Block was edited in another window", {
          currentVersion: pickConflictCurrentVersion(result.conflicts, expectedVersion),
        });
      }

      const updated = result.updated.blocks.find((b) => b.id === blockId);

      if (!updated) {
        throw new Error("Block update succeeded but server response was empty");
      }

      return updated;
    },
    [blockId, planId],
  );
};

export const useSegmentBulkPatchUpdate = (planId: string, segmentId: string) => {
  return useCallback(
    async (draft: BlockSegment, expectedVersion: number): Promise<BlockSegment> => {
      const op: BulkPatchOp = {
        kind: "update-segment",
        segmentId,
        expectedVersion,
        fullEntity: {
          order: draft.order,
          label: draft.label,
          archetypeKind: draft.archetypeKind,
          schemeParams: draft.schemeParams,
          schemeTemplateId: draft.schemeTemplateId,
          restConfig: draft.restConfig,
        },
      };

      const result = await api.planBulkPatch.patch(planId, { ops: [op] });

      if (result.conflicts && result.conflicts.length > 0) {
        throw new ConflictError("Segment was edited in another window", {
          currentVersion: pickConflictCurrentVersion(result.conflicts, expectedVersion),
        });
      }

      const updated = result.updated.segments.find((s) => s.id === segmentId);

      if (!updated) {
        throw new Error("Segment update succeeded but server response was empty");
      }

      return updated;
    },
    [planId, segmentId],
  );
};

export const useEntryBulkPatchUpdate = (planId: string, entryId: string) => {
  return useCallback(
    async (draft: ExerciseEntry, expectedVersion: number): Promise<ExerciseEntry> => {
      const op: BulkPatchOp = {
        kind: "update-entry",
        entryId,
        expectedVersion,
        fullEntity: {
          order: draft.order,
          exerciseId: draft.exerciseId,
          exerciseSnapshot: draft.exerciseSnapshot,
          prescription: draft.prescription,
          alternatives: draft.alternatives,
          externalUrl: draft.externalUrl,
          notes: draft.notes,
        },
      };

      const result = await api.planBulkPatch.patch(planId, { ops: [op] });

      if (result.conflicts && result.conflicts.length > 0) {
        throw new ConflictError("Entry was edited in another window", {
          currentVersion: pickConflictCurrentVersion(result.conflicts, expectedVersion),
        });
      }

      const updated = result.updated.entries.find((e) => e.id === entryId);

      if (!updated) {
        throw new Error("Entry update succeeded but server response was empty");
      }

      return updated;
    },
    [entryId, planId],
  );
};
