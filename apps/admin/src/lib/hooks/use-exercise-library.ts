"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateExerciseLibraryItemInput,
  type DemoteExerciseLibraryItemInput,
  type ExerciseLibraryItem,
  type ListExerciseLibraryItemsResponse,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const exerciseLibraryHooks = createCrudHooks<
  ListExerciseLibraryItemsResponse,
  ExerciseLibraryItem,
  CreateExerciseLibraryItemInput,
  UpdateExerciseLibraryItemInput
>({
  entityName: "Exercise",
  keys: adminKeys.library.exercises,
  api: {
    getPageData: api.library.exercises.list,
    getById: api.library.exercises.getById,
    create: api.library.exercises.create,
    update: api.library.exercises.update,
    delete: api.library.exercises.delete,
  },
  redirectTo: "/library/exercises",
  useNavigate,
});

export const useExercisesPageData = exerciseLibraryHooks.usePageData;
export const useCreateExercise = exerciseLibraryHooks.useCreate;
export const useUpdateExercise = exerciseLibraryHooks.useUpdate;
export const useDeleteExercise = exerciseLibraryHooks.useDelete;

export const useExercise = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.exercises.byId(id),
    queryFn: () => api.library.exercises.getById(id),
    enabled: !!id,
  });

export const usePromoteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<ExerciseLibraryItem, Error, string>({
    mutationFn: (id) => api.library.exercises.promote(id),
    onSuccess: (result) => {
      toast.success("Exercise promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.exercises.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.library.exercises.byId(result.id) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to promote exercise");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteExerciseLibraryItemInput;
};

export const useDemoteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<ExerciseLibraryItem, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.exercises.demote(id, data),
    onSuccess: (result) => {
      toast.success("Exercise demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.exercises.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.library.exercises.byId(result.id) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to demote exercise");
    },
  });
};
