"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateExerciseLibraryItemInput,
  type ExerciseLibraryItem,
  type ListExerciseLibraryItemsResponse,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export type LibraryListParams = {
  search?: string;
  scope?: "OWN" | "SYSTEM" | "ALL";
  take?: number;
};

const DEFAULT_TAKE = 100;

const buildExerciseQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useExercisesPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListExerciseLibraryItemsResponse>({
    queryKey: [
      ...platformKeys.library.exercises.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.exercises.list(buildExerciseQuery(params, ownerId)),
  });

export const useExercise = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.exercises.byId(id),
    queryFn: () => api.library.exercises.getById(id),
    enabled: !!id,
  });

export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<ExerciseLibraryItem, Error, CreateExerciseLibraryItemInput>({
    mutationFn: (data) => api.library.exercises.create(data),
    onSuccess: () => {
      toast.success("Exercise created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.exercises.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create exercise");
    },
  });
};

type UpdateExerciseVariables = {
  id: string;
  data: UpdateExerciseLibraryItemInput;
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<ExerciseLibraryItem, Error, UpdateExerciseVariables>({
    mutationFn: ({ id, data }) => api.library.exercises.update(id, data),
    onSuccess: (result) => {
      toast.success("Exercise updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.exercises.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.library.exercises.byId(result.id) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update exercise");
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.exercises.delete(id),
    onSuccess: () => {
      toast.success("Exercise deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.exercises.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete exercise");
    },
  });
};
