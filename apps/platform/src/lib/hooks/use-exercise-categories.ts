"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
} from "@repo/contracts/exercise-category";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useExerciseCategories = () => {
  return useQuery<ExerciseCategory[]>({
    queryKey: platformKeys.exerciseCategories.all(),
    queryFn: api.exerciseCategories.getAll,
  });
};

export const useCreateExerciseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseCategoryData) => api.exerciseCategories.create(data),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({
        queryKey: platformKeys.exerciseCategories.all(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
};
