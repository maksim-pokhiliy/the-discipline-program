"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreatePrescribedSetData,
  PrescribedSet,
  UpdatePrescribedSetData,
} from "@repo/contracts/prescribed-set";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const usePrescribedSets = (blockId: string) =>
  useQuery({
    queryKey: platformKeys.prescribedSets.byBlock(blockId),
    queryFn: () => api.prescribedSets.getAll(blockId),
    enabled: !!blockId,
  });

export const useCreatePrescribedSet = (blockId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrescribedSetData) => api.prescribedSets.create(blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.prescribedSets.byBlock(blockId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add exercise");
    },
  });
};

export const useUpdatePrescribedSet = (blockId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrescribedSetData }) =>
      api.prescribedSets.update(blockId, id, data),
    onMutate: async ({ id, data }) => {
      const key = platformKeys.prescribedSets.byBlock(blockId);

      await queryClient.cancelQueries({ queryKey: key });

      const previousSets = queryClient.getQueryData<PrescribedSet[]>(key);

      if (previousSets) {
        queryClient.setQueryData(
          key,
          previousSets.map((s) => (s.id === id ? { ...s, ...data } : s)),
        );
      }

      return { previousSets };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(
          platformKeys.prescribedSets.byBlock(blockId),
          context.previousSets,
        );
      }

      toast.error("Failed to update set");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.prescribedSets.byBlock(blockId),
      });
    },
  });
};

export const useDeletePrescribedSet = (blockId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.prescribedSets.delete(blockId, id),
    onMutate: async (id) => {
      const key = platformKeys.prescribedSets.byBlock(blockId);

      await queryClient.cancelQueries({ queryKey: key });

      const previousSets = queryClient.getQueryData<PrescribedSet[]>(key);

      if (previousSets) {
        queryClient.setQueryData(
          key,
          previousSets.filter((s) => s.id !== id),
        );
      }

      return { previousSets };
    },
    onError: (_error, _id, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(
          platformKeys.prescribedSets.byBlock(blockId),
          context.previousSets,
        );
      }

      toast.error("Failed to delete set");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.prescribedSets.byBlock(blockId),
      });
    },
  });
};
