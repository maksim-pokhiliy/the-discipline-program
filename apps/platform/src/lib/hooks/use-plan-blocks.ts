"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  CreatePlanBlockRequest,
  CreatePlanBlockResponse,
  GetPlanBlocksResponse,
  UpdatePlanBlockRequest,
  UpdatePlanBlockResponse,
} from "@repo/contracts/lms/plan-block";
import { useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { applyBlockUpdate } from "./lib/apply-block-update";

type PlanBlockScope = {
  planId: string;
  sessionId: string;
};

export const useBlocksBySession = (planId: string, sessionId: string) =>
  useQuery({
    queryKey: platformKeys.planBlocks.bySession(planId, sessionId),
    queryFn: () => api.planBlocks.listBySession(planId, sessionId),
  });

export const useCreatePlanBlock = ({ planId, sessionId }: PlanBlockScope) =>
  useOptimisticMutation<GetPlanBlocksResponse, CreatePlanBlockRequest, CreatePlanBlockResponse>({
    mutationFn: (data) => api.planBlocks.create(planId, sessionId, data),
    queryKey: () => platformKeys.planBlocks.bySession(planId, sessionId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planBlocks.bySession(planId, sessionId)],
    errorMessage: "Failed to create block",
  });

export const useUpdatePlanBlock = ({ planId, sessionId }: PlanBlockScope) =>
  useOptimisticMutation<
    GetPlanBlocksResponse,
    { id: string; data: UpdatePlanBlockRequest },
    UpdatePlanBlockResponse
  >({
    mutationFn: ({ id, data }) => api.planBlocks.update(planId, id, data),
    queryKey: () => platformKeys.planBlocks.bySession(planId, sessionId),
    transform: (prev, { id, data }) => applyBlockUpdate(prev, id, data),
    invalidateKeys: ({ id }) => [
      platformKeys.planBlocks.bySession(planId, sessionId),
      platformKeys.planItems.byBlock(planId, id),
    ],
    errorMessage: "Failed to update block",
  });

export const useDeletePlanBlock = ({ planId, sessionId }: PlanBlockScope) =>
  useOptimisticMutation<GetPlanBlocksResponse, string, void>({
    mutationFn: (id) => api.planBlocks.delete(planId, id),
    queryKey: () => platformKeys.planBlocks.bySession(planId, sessionId),
    transform: (prev, id) => ({ blocks: prev.blocks.filter((block) => block.id !== id) }),
    invalidateKeys: (id) => [
      platformKeys.planBlocks.bySession(planId, sessionId),
      platformKeys.planItems.byBlock(planId, id),
    ],
    errorMessage: "Failed to delete block",
  });
