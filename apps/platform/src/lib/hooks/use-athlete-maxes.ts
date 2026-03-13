"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AthleteMax, CreateAthleteMaxData } from "@repo/contracts/athlete-max";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useAthleteMaxesForPlan = (planId: string, exerciseIds: string[]) =>
  useQuery({
    queryKey: platformKeys.athleteMaxes.forPlanExercises(planId, exerciseIds),
    queryFn: () => api.athleteMaxes.getForPlanExercises(planId, exerciseIds),
    enabled: !!planId && exerciseIds.length > 0,
  });

export const useCreateAthleteMax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAthleteMaxData) => api.athleteMaxes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...platformKeys.root, "athlete-maxes"],
      });
      toast.success("1RM recorded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record 1RM");
    },
  });
};

export const useDeleteAthleteMax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.athleteMaxes.delete(id),
    onMutate: async (id) => {
      const allQueries = queryClient.getQueriesData<AthleteMax[]>({
        queryKey: [...platformKeys.root, "athlete-maxes"],
      });

      for (const [key, data] of allQueries) {
        if (Array.isArray(data)) {
          queryClient.setQueryData(
            key,
            data.filter((m) => m.id !== id),
          );
        }
      }

      return { allQueries };
    },
    onError: (_error, _id, context) => {
      if (context?.allQueries) {
        for (const [key, data] of context.allQueries) {
          queryClient.setQueryData(key, data);
        }
      }

      toast.error("Failed to delete 1RM");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...platformKeys.root, "athlete-maxes"],
      });
    },
  });
};
