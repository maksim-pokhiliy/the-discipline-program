"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { type Block, type BlockSegment, type ExerciseEntry } from "@repo/contracts/lms";
import { type BulkPatchOp, type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";
import { ConflictError } from "@repo/errors";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

type EntityKind = "block" | "segment" | "entry";

const findCurrentVersion = (
  planStructure: GetPlanStructureResponse | undefined,
  kind: EntityKind,
  id: string,
): number | null => {
  if (!planStructure) {
    return null;
  }

  for (const week of planStructure.plan.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          if (kind === "block" && block.id === id) {
            return block.version;
          }

          for (const segment of block.segments) {
            if (kind === "segment" && segment.id === id) {
              return segment.version;
            }

            for (const setGroup of segment.setGroups) {
              for (const entry of setGroup.entries) {
                if (kind === "entry" && entry.id === id) {
                  return entry.version;
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
};

const lookupCurrentVersion = (
  queryClient: ReturnType<typeof useQueryClient>,
  planId: string,
  kind: EntityKind,
  id: string,
): number | null => {
  const matches = queryClient.getQueriesData<GetPlanStructureResponse>({
    queryKey: platformKeys.trainingPlans.structureByPlan(planId),
  });

  for (const [, data] of matches) {
    const version = findCurrentVersion(data, kind, id);

    if (version !== null) {
      return version;
    }
  }

  return null;
};

export const useBlockBulkPatchUpdate = (planId: string, blockId: string) => {
  const queryClient = useQueryClient();

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
        const currentVersion = lookupCurrentVersion(queryClient, planId, "block", blockId);

        throw new ConflictError("Block was edited in another window", {
          currentVersion: currentVersion ?? expectedVersion + 1,
        });
      }

      const updated = result.updated.blocks.find((b) => b.id === blockId);

      if (!updated) {
        throw new Error("Block update succeeded but server response was empty");
      }

      return updated;
    },
    [blockId, planId, queryClient],
  );
};

export const useSegmentBulkPatchUpdate = (planId: string, segmentId: string) => {
  const queryClient = useQueryClient();

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
        const currentVersion = lookupCurrentVersion(queryClient, planId, "segment", segmentId);

        throw new ConflictError("Segment was edited in another window", {
          currentVersion: currentVersion ?? expectedVersion + 1,
        });
      }

      const updated = result.updated.segments.find((s) => s.id === segmentId);

      if (!updated) {
        throw new Error("Segment update succeeded but server response was empty");
      }

      return updated;
    },
    [planId, queryClient, segmentId],
  );
};

export const useEntryBulkPatchUpdate = (planId: string, entryId: string) => {
  const queryClient = useQueryClient();

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
        const currentVersion = lookupCurrentVersion(queryClient, planId, "entry", entryId);

        throw new ConflictError("Entry was edited in another window", {
          currentVersion: currentVersion ?? expectedVersion + 1,
        });
      }

      const updated = result.updated.entries.find((e) => e.id === entryId);

      if (!updated) {
        throw new Error("Entry update succeeded but server response was empty");
      }

      return updated;
    },
    [entryId, planId, queryClient],
  );
};
