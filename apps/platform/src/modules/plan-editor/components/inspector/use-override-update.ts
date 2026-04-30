"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { type Block, type BlockSegment, type ExerciseEntry } from "@repo/contracts/lms";
import {
  type CreatePlanOverrideBody,
  type ListEnrollmentOverridesResponse,
  type PlanOverride,
  type PlanOverridePayload,
  PlanOverrideKind,
  PlanOverrideScope,
} from "@repo/contracts/lms/plan-override";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";
import { useCreateOverride, useUpdateOverride } from "@app/lib/hooks";

type ScopeKey = PlanOverrideScope.BLOCK | PlanOverrideScope.BLOCK_SEGMENT | PlanOverrideScope.ENTRY;

const findExisting = (
  overrides: ListEnrollmentOverridesResponse | undefined,
  scope: ScopeKey,
  scopeId: string,
): PlanOverride | undefined =>
  overrides?.find(
    (o) => o.scope === scope && o.scopeId === scopeId && o.kind === PlanOverrideKind.REPLACE,
  );

export const useBlockOverrideUpdate = (enrollmentId: string, blockId: string) => {
  const queryClient = useQueryClient();
  const createOverride = useCreateOverride(enrollmentId);
  const updateOverride = useUpdateOverride();

  return useCallback(
    async (draft: Block, _expectedVersion: number): Promise<Block> => {
      const overrides = await queryClient.ensureQueryData<ListEnrollmentOverridesResponse>({
        queryKey: platformKeys.planOverrides.byEnrollment(enrollmentId),
        queryFn: () => api.planOverrides.listForEnrollment(enrollmentId),
      });

      const payload: PlanOverridePayload = { kind: PlanOverrideKind.REPLACE, snapshot: draft };
      const existing = findExisting(overrides, PlanOverrideScope.BLOCK, blockId);

      if (existing) {
        await updateOverride.mutateAsync({
          overrideId: existing.id,
          enrollmentId,
          data: { payload },
        });
      } else {
        const body: CreatePlanOverrideBody = {
          scope: PlanOverrideScope.BLOCK,
          scopeId: blockId,
          kind: PlanOverrideKind.REPLACE,
          payload,
        };

        await createOverride.mutateAsync(body);
      }

      return draft;
    },
    [blockId, createOverride, enrollmentId, queryClient, updateOverride],
  );
};

export const useSegmentOverrideUpdate = (enrollmentId: string, segmentId: string) => {
  const queryClient = useQueryClient();
  const createOverride = useCreateOverride(enrollmentId);
  const updateOverride = useUpdateOverride();

  return useCallback(
    async (draft: BlockSegment, _expectedVersion: number): Promise<BlockSegment> => {
      const overrides = await queryClient.ensureQueryData<ListEnrollmentOverridesResponse>({
        queryKey: platformKeys.planOverrides.byEnrollment(enrollmentId),
        queryFn: () => api.planOverrides.listForEnrollment(enrollmentId),
      });

      const payload: PlanOverridePayload = { kind: PlanOverrideKind.REPLACE, snapshot: draft };
      const existing = findExisting(overrides, PlanOverrideScope.BLOCK_SEGMENT, segmentId);

      if (existing) {
        await updateOverride.mutateAsync({
          overrideId: existing.id,
          enrollmentId,
          data: { payload },
        });
      } else {
        const body: CreatePlanOverrideBody = {
          scope: PlanOverrideScope.BLOCK_SEGMENT,
          scopeId: segmentId,
          kind: PlanOverrideKind.REPLACE,
          payload,
        };

        await createOverride.mutateAsync(body);
      }

      return draft;
    },
    [createOverride, enrollmentId, queryClient, segmentId, updateOverride],
  );
};

export const useEntryOverrideUpdate = (enrollmentId: string, entryId: string) => {
  const queryClient = useQueryClient();
  const createOverride = useCreateOverride(enrollmentId);
  const updateOverride = useUpdateOverride();

  return useCallback(
    async (draft: ExerciseEntry, _expectedVersion: number): Promise<ExerciseEntry> => {
      const overrides = await queryClient.ensureQueryData<ListEnrollmentOverridesResponse>({
        queryKey: platformKeys.planOverrides.byEnrollment(enrollmentId),
        queryFn: () => api.planOverrides.listForEnrollment(enrollmentId),
      });

      const payload: PlanOverridePayload = { kind: PlanOverrideKind.REPLACE, snapshot: draft };
      const existing = findExisting(overrides, PlanOverrideScope.ENTRY, entryId);

      if (existing) {
        await updateOverride.mutateAsync({
          overrideId: existing.id,
          enrollmentId,
          data: { payload },
        });
      } else {
        const body: CreatePlanOverrideBody = {
          scope: PlanOverrideScope.ENTRY,
          scopeId: entryId,
          kind: PlanOverrideKind.REPLACE,
          payload,
        };

        await createOverride.mutateAsync(body);
      }

      return draft;
    },
    [createOverride, enrollmentId, entryId, queryClient, updateOverride],
  );
};
