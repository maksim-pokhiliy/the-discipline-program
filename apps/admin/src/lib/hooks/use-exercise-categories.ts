"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
  UpdateExerciseCategoryData,
} from "@repo/contracts/exercise-category";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

export const useExerciseCategories = (initialData?: ExerciseCategory[]) => {
  return useQuery({
    queryKey: adminKeys.exerciseCategories.all(),
    queryFn: api.exerciseCategories.getAll,
    initialData,
    staleTime: STALE_TIMES.MEDIUM,
  });
};

export const useCreateExerciseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseCategoryData) => api.exerciseCategories.create(data),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exerciseCategories.all() });
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
};

export const useUpdateExerciseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseCategoryData }) =>
      api.exerciseCategories.update(id, data),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exerciseCategories.all() });
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });
};

export const useDeleteExerciseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.exerciseCategories.delete,
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exerciseCategories.all() });
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
};
