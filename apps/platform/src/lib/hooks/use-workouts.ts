"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateWorkoutData, UpdateWorkoutData, Workout } from "@repo/contracts/workout";
import { platformKeys } from "@repo/query";

import { api } from "../api";

import { useOptimisticMutation } from "./use-optimistic-mutation";

export const useWorkouts = (planId: string) =>
  useQuery({
    queryKey: platformKeys.workouts.byPlan(planId),
    queryFn: () => api.workouts.getAll(planId),
    enabled: !!planId,
  });

export const useCreateWorkout = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutData) => api.workouts.create(planId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.workouts.byPlan(planId) });

      const previousWorkouts = queryClient.getQueryData<Workout[]>(
        platformKeys.workouts.byPlan(planId),
      );

      const optimisticWorkout: Workout = {
        id: `temp-${crypto.randomUUID()}`,
        planId,
        scheduledDate: data.scheduledDate ?? null,
        title: data.title ?? "",
        description: data.description ?? null,
        content: data.content ?? null,
        sortOrder: -1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(platformKeys.workouts.byPlan(planId), [
        ...(previousWorkouts ?? []),
        optimisticWorkout,
      ]);

      return { previousWorkouts };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(platformKeys.workouts.byPlan(planId), context.previousWorkouts);
      }

      toast.error("Failed to create workout");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.calendar.all() });
    },
  });
};

export const useUpdateWorkout = (planId: string) =>
  useOptimisticMutation<Workout[], { id: string; data: UpdateWorkoutData }>({
    mutationFn: ({ id, data }) => api.workouts.update(planId, id, data),
    queryKey: platformKeys.workouts.byPlan(planId),
    transform: (prev, { id, data }) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)),
    invalidateKeys: [platformKeys.workouts.byPlan(planId)],
    errorMessage: "Failed to update workout",
  });

export const useDeleteWorkout = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.workouts.delete(planId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.calendar.all() });
      toast.success("Workout deleted");
    },
    onError: () => {
      toast.error("Failed to delete workout");
    },
  });
};

type MoveWorkoutVars = {
  workoutId: string;
  scheduledDate: Date;
  targetDayOrderedIds?: string[];
};

export const useMoveWorkout = (planId: string) =>
  useOptimisticMutation<Workout[], MoveWorkoutVars>({
    mutationFn: ({ workoutId, scheduledDate, targetDayOrderedIds }) =>
      api.workouts.move(workoutId, scheduledDate, targetDayOrderedIds),
    queryKey: platformKeys.workouts.byPlan(planId),
    transform: (prev, { workoutId, scheduledDate, targetDayOrderedIds }) => {
      let updated = prev.map((w) => (w.id === workoutId ? { ...w, scheduledDate } : w));

      if (targetDayOrderedIds) {
        const orderMap = new Map(targetDayOrderedIds.map((id, index) => [id, index]));

        updated = updated.map((w) => {
          const newOrder = orderMap.get(w.id);

          return newOrder !== undefined ? { ...w, sortOrder: newOrder } : w;
        });
      }

      return updated;
    },
    invalidateKeys: [
      platformKeys.workouts.byPlan(planId),
      platformKeys.trainingPlans.page(),
      platformKeys.calendar.all(),
    ],
    errorMessage: "Failed to move workout",
  });

export const useReorderWorkouts = (planId: string) =>
  useOptimisticMutation<Workout[], string[]>({
    mutationFn: (orderedIds) => api.workouts.reorder(planId, orderedIds),
    queryKey: platformKeys.workouts.byPlan(planId),
    transform: (prev, orderedIds) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

      return prev.map((w) => {
        const newOrder = orderMap.get(w.id);

        return newOrder !== undefined ? { ...w, sortOrder: newOrder } : w;
      });
    },
    invalidateKeys: [platformKeys.workouts.byPlan(planId)],
    errorMessage: "Failed to reorder workouts",
  });

export const useCopyWeek = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceDate, targetDate }: { sourceDate: Date; targetDate: Date }) =>
      api.workouts.copyWeek(planId, sourceDate, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.calendar.all() });
      toast.success("Week copied");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to copy week");
    },
  });
};
