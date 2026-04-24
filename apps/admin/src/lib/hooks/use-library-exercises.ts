"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateExerciseData,
  Exercise,
  GetExercisesQuery,
  GetExercisesResponse,
  MergeExerciseData,
  RejectExerciseData,
  UpdateExerciseData,
} from "@repo/contracts/library/exercise";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const libraryExerciseHooks = createCrudHooks<
  GetExercisesResponse,
  Exercise,
  CreateExerciseData,
  UpdateExerciseData
>({
  entityName: "Exercise",
  keys: {
    page: () => adminKeys.libraryExercises.list(),
    byId: adminKeys.libraryExercises.byId,
  },
  api: {
    getPageData: () => api.libraryExercises.list(),
    getById: api.libraryExercises.getById,
    create: api.libraryExercises.create,
    update: api.libraryExercises.update,
    delete: api.libraryExercises.delete,
  },
  redirectTo: "/library/exercises",
  useNavigate,
});

export const useLibraryExercise = libraryExerciseHooks.useById;
export const useCreateLibraryExercise = libraryExerciseHooks.useCreate;
export const useUpdateLibraryExercise = libraryExerciseHooks.useUpdate;
export const useDeleteLibraryExercise = libraryExerciseHooks.useDelete;

export const useLibraryExercises = (query: GetExercisesQuery = {}) =>
  useQuery({
    queryKey: adminKeys.libraryExercises.list(query),
    queryFn: () => api.libraryExercises.list(query),
  });

const invalidateLibraryExerciseLists = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: adminKeys.libraryExercises.all() });
};

export const useApproveLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<Exercise, Error, string>({
    mutationFn: (id) => api.libraryExercises.approve(id),
    onSuccess: (result) => {
      toast.success("Exercise approved");
      invalidateLibraryExerciseLists(queryClient);
      queryClient.invalidateQueries({ queryKey: adminKeys.libraryExercises.byId(result.id) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve exercise");
    },
  });
};

export const useRejectLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<Exercise, Error, { id: string; data: RejectExerciseData }>({
    mutationFn: ({ id, data }) => api.libraryExercises.reject(id, data),
    onSuccess: (result) => {
      toast.success("Exercise rejected");
      invalidateLibraryExerciseLists(queryClient);
      queryClient.invalidateQueries({ queryKey: adminKeys.libraryExercises.byId(result.id) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject exercise");
    },
  });
};

export const useMergeLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<Exercise, Error, { id: string; data: MergeExerciseData }>({
    mutationFn: ({ id, data }) => api.libraryExercises.merge(id, data),
    onSuccess: (_result, variables) => {
      toast.success("Exercise merged");
      invalidateLibraryExerciseLists(queryClient);
      queryClient.invalidateQueries({ queryKey: adminKeys.libraryExercises.byId(variables.id) });
      queryClient.invalidateQueries({
        queryKey: adminKeys.libraryExercises.byId(variables.data.targetExerciseId),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to merge exercise");
    },
  });
};
