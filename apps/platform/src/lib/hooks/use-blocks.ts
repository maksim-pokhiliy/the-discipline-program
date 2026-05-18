"use client";

import type {
  AssignBlockLabelsData,
  Block,
  CreateBlockData,
  ReorderBlocksData,
  UpdateBlockData,
} from "@repo/contracts/lms/block";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateBlock = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<CreateBlockData, Block>({
    mutationFn: (data) => api.blocks.create(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Block created",
    errorMessage: "Failed to create block",
  });

export const useUpdateBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: UpdateBlockData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.update(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block updated",
    errorMessage: "Failed to update block",
  });

export const useDeleteBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string }, void>({
    mutationFn: ({ blockId }) => api.blocks.delete(planId, blockId),
    planId,
    startDate,
    successMessage: "Block deleted",
    errorMessage: "Failed to delete block",
  });

export const useReorderBlocks = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<ReorderBlocksData, { blocks: Block[] }>({
    mutationFn: (data) => api.blocks.reorder(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Blocks reordered",
    errorMessage: "Failed to reorder blocks",
  });

export const useAssignBlockLabels = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: AssignBlockLabelsData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.assignLabels(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block labels saved",
    errorMessage: "Failed to save block labels",
  });
