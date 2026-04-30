"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BulkPatchPlanInput,
  type BulkPatchPlanResponse,
  type GetPlanStructureResponse,
  type PlanStructureBlock,
  type PlanStructureSegment,
  type PlanStructureSetGroup,
} from "@repo/contracts/lms/training-plan";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type StructureMutator = (current: GetPlanStructureResponse) => GetPlanStructureResponse;

const applyUpdatedToCache = (
  current: GetPlanStructureResponse,
  updated: BulkPatchPlanResponse["updated"],
): GetPlanStructureResponse => {
  const blockMap = new Map(updated.blocks.map((b) => [b.id, b] as const));
  const segmentMap = new Map(updated.segments.map((s) => [s.id, s] as const));
  const entryMap = new Map(updated.entries.map((e) => [e.id, e] as const));

  if (blockMap.size === 0 && segmentMap.size === 0 && entryMap.size === 0) {
    return current;
  }

  const mergeSetGroup = (sg: PlanStructureSetGroup): PlanStructureSetGroup => ({
    ...sg,
    entries: sg.entries.map((entry) => entryMap.get(entry.id) ?? entry),
  });

  const mergeSegment = (segment: PlanStructureSegment): PlanStructureSegment => {
    const updatedSegment = segmentMap.get(segment.id);
    const next = updatedSegment ? { ...segment, ...updatedSegment } : segment;

    return { ...next, setGroups: segment.setGroups.map(mergeSetGroup) };
  };

  const mergeBlock = (block: PlanStructureBlock): PlanStructureBlock => {
    const updatedBlock = blockMap.get(block.id);
    const next = updatedBlock ? { ...block, ...updatedBlock } : block;

    return { ...next, segments: next.segments.map(mergeSegment) };
  };

  return {
    ...current,
    plan: {
      ...current.plan,
      weeks: current.plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((session) => ({
            ...session,
            blocks: session.blocks.map(mergeBlock),
          })),
        })),
      })),
    },
  };
};

export type PlanBulkPatchContext = {
  optimistic: boolean;
  rollback?: () => void;
};

export type UsePlanBulkPatchOptions = {
  optimisticPatch?: StructureMutator;
};

export const usePlanBulkPatch = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    BulkPatchPlanResponse,
    Error,
    BulkPatchPlanInput & UsePlanBulkPatchOptions,
    PlanBulkPatchContext
  >({
    mutationFn: ({ ops }) => api.planBulkPatch.patch(planId, { ops }),
    onMutate: async (variables) => {
      if (!variables.optimisticPatch) {
        return { optimistic: false };
      }

      const baseKey = platformKeys.trainingPlans.structureByPlan(planId);

      await queryClient.cancelQueries({ queryKey: baseKey });

      const snapshots = queryClient.getQueriesData<GetPlanStructureResponse>({
        queryKey: baseKey,
      });

      const patcher = variables.optimisticPatch;

      snapshots.forEach(([key, data]) => {
        if (!data) {
          return;
        }

        queryClient.setQueryData<GetPlanStructureResponse>(key, patcher(data));
      });

      return {
        optimistic: true,
        rollback: () => {
          snapshots.forEach(([key, data]) => {
            queryClient.setQueryData<GetPlanStructureResponse>(key, data);
          });
        },
      };
    },
    onSuccess: (result, _vars, context) => {
      if (result.conflicts && result.conflicts.length > 0) {
        context?.rollback?.();
        void queryClient.invalidateQueries({
          queryKey: platformKeys.trainingPlans.structureByPlan(planId),
        });
        toast.error("Edited in another window — refresh to reconcile");

        return;
      }

      const snapshots = queryClient.getQueriesData<GetPlanStructureResponse>({
        queryKey: platformKeys.trainingPlans.structureByPlan(planId),
      });

      snapshots.forEach(([key, data]) => {
        if (!data) {
          return;
        }

        queryClient.setQueryData<GetPlanStructureResponse>(
          key,
          applyUpdatedToCache(data, result.updated),
        );
      });
    },
    onError: (error, _vars, context) => {
      context?.rollback?.();
      notifyError(error, "Failed to apply plan changes");
    },
  });
};
