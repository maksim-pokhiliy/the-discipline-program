"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateWorkoutData, UpdateWorkoutData, Workout } from "@repo/contracts/workout";
import { platformKeys } from "@repo/query";

import { api } from "../api";

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
      queryClient.invalidateQueries({ queryKey: [...platformKeys.root, "calendar"] });
    },
  });
};

export const useUpdateWorkout = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkoutData }) =>
      api.workouts.update(planId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.workouts.byPlan(planId) });

      const previousWorkouts = queryClient.getQueryData<Workout[]>(
        platformKeys.workouts.byPlan(planId),
      );

      if (previousWorkouts) {
        queryClient.setQueryData(
          platformKeys.workouts.byPlan(planId),
          previousWorkouts.map((w) => (w.id === id ? { ...w, ...data } : w)),
        );
      }

      return { previousWorkouts };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(platformKeys.workouts.byPlan(planId), context.previousWorkouts);
      }

      toast.error("Failed to update workout");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
    },
  });
};

export const useDeleteWorkout = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.workouts.delete(planId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: [...platformKeys.root, "calendar"] });
      toast.success("Workout deleted");
    },
    onError: () => {
      toast.error("Failed to delete workout");
    },
  });
};

export const useMoveWorkout = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workoutId,
      scheduledDate,
      targetDayOrderedIds,
    }: {
      workoutId: string;
      scheduledDate: Date;
      targetDayOrderedIds?: string[];
    }) => api.workouts.move(workoutId, scheduledDate, targetDayOrderedIds),
    onMutate: async ({ workoutId, scheduledDate, targetDayOrderedIds }) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.workouts.byPlan(planId) });

      const previousWorkouts = queryClient.getQueryData<Workout[]>(
        platformKeys.workouts.byPlan(planId),
      );

      if (previousWorkouts) {
        let updated = previousWorkouts.map((w) =>
          w.id === workoutId ? { ...w, scheduledDate } : w,
        );

        if (targetDayOrderedIds) {
          const orderMap = new Map(targetDayOrderedIds.map((id, index) => [id, index]));

          updated = updated.map((w) => {
            const newOrder = orderMap.get(w.id);

            return newOrder !== undefined ? { ...w, sortOrder: newOrder } : w;
          });
        }

        queryClient.setQueryData(platformKeys.workouts.byPlan(planId), updated);
      }

      return { previousWorkouts };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(platformKeys.workouts.byPlan(planId), context.previousWorkouts);
      }

      toast.error("Failed to move workout");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: [...platformKeys.root, "calendar"] });
    },
  });
};

export const useReorderWorkouts = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => api.workouts.reorder(planId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.workouts.byPlan(planId) });

      const previousWorkouts = queryClient.getQueryData<Workout[]>(
        platformKeys.workouts.byPlan(planId),
      );

      if (previousWorkouts) {
        const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

        queryClient.setQueryData(
          platformKeys.workouts.byPlan(planId),
          previousWorkouts.map((w) => {
            const newOrder = orderMap.get(w.id);

            return newOrder !== undefined ? { ...w, sortOrder: newOrder } : w;
          }),
        );
      }

      return { previousWorkouts };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(platformKeys.workouts.byPlan(planId), context.previousWorkouts);
      }

      toast.error("Failed to reorder workouts");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
    },
  });
};

export const useCopyWeek = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceDate, targetDate }: { sourceDate: Date; targetDate: Date }) =>
      api.workouts.copyWeek(planId, sourceDate, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.workouts.byPlan(planId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: [...platformKeys.root, "calendar"] });
      toast.success("Week copied");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to copy week");
    },
  });
};
