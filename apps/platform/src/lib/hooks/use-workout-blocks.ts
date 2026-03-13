"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateWorkoutBlockData,
  UpdateWorkoutBlockData,
  WorkoutBlock,
} from "@repo/contracts/workout-block";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useWorkoutBlocks = (workoutId: string) =>
  useQuery({
    queryKey: platformKeys.workoutBlocks.byWorkout(workoutId),
    queryFn: () => api.workoutBlocks.getAll(workoutId),
    enabled: !!workoutId,
  });

export const useCreateWorkoutBlock = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutBlockData) => api.workoutBlocks.create(workoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.workoutBlocks.byWorkout(workoutId),
      });
      toast.success("Block added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add block");
    },
  });
};

export const useUpdateWorkoutBlock = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkoutBlockData }) =>
      api.workoutBlocks.update(workoutId, id, data),
    onMutate: async ({ id, data }) => {
      const key = platformKeys.workoutBlocks.byWorkout(workoutId);

      await queryClient.cancelQueries({ queryKey: key });

      const previousBlocks = queryClient.getQueryData<WorkoutBlock[]>(key);

      if (previousBlocks) {
        queryClient.setQueryData(
          key,
          previousBlocks.map((b) => (b.id === id ? { ...b, ...data } : b)),
        );
      }

      return { previousBlocks };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousBlocks) {
        queryClient.setQueryData(
          platformKeys.workoutBlocks.byWorkout(workoutId),
          context.previousBlocks,
        );
      }

      toast.error("Failed to update block");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.workoutBlocks.byWorkout(workoutId),
      });
    },
  });
};

export const useDeleteWorkoutBlock = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.workoutBlocks.delete(workoutId, id),
    onMutate: async (id) => {
      const key = platformKeys.workoutBlocks.byWorkout(workoutId);

      await queryClient.cancelQueries({ queryKey: key });

      const previousBlocks = queryClient.getQueryData<WorkoutBlock[]>(key);

      if (previousBlocks) {
        queryClient.setQueryData(
          key,
          previousBlocks.filter((b) => b.id !== id),
        );
      }

      return { previousBlocks };
    },
    onError: (_error, _id, context) => {
      if (context?.previousBlocks) {
        queryClient.setQueryData(
          platformKeys.workoutBlocks.byWorkout(workoutId),
          context.previousBlocks,
        );
      }

      toast.error("Failed to delete block");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.workoutBlocks.byWorkout(workoutId),
      });
    },
  });
};

export const useReorderSets = (blockId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => api.workoutBlocks.reorderSets(blockId, orderedIds),
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.prescribedSets.byBlock(blockId),
      });
      toast.error("Failed to reorder sets");
    },
  });
};
