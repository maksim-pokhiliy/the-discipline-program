"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateExerciseData,
  Exercise,
  GetExercisesQuery,
  UpdateExerciseData,
} from "@repo/contracts/library/exercise";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const MIN_SEARCH_LENGTH = 2;

export const useLibraryExercises = (query: GetExercisesQuery = {}) =>
  useQuery({
    queryKey: platformKeys.libraryExercises.list(query),
    queryFn: () => api.libraryExercises.list(query),
  });

export const useLibraryExerciseSearch = (searchTerm: string, enabled = true) => {
  const trimmed = searchTerm.trim();

  return useQuery({
    queryKey: platformKeys.libraryExercises.search(trimmed),
    queryFn: () =>
      api.libraryExercises.list({
        search: trimmed,
        includeOwnDrafts: true,
      }),
    enabled: enabled && trimmed.length >= MIN_SEARCH_LENGTH,
    staleTime: 30_000,
  });
};

export const useMyLibraryExercises = (query: GetExercisesQuery = {}) =>
  useQuery({
    queryKey: platformKeys.libraryExercises.mine(query),
    queryFn: () => api.libraryExercises.listMine(query),
  });

export const useLibraryExerciseById = (id: string | null | undefined) =>
  useQuery({
    queryKey: platformKeys.libraryExercises.byId(id ?? ""),
    queryFn: () => {
      if (!id) {
        throw new Error("Exercise id is required");
      }

      return api.libraryExercises.getById(id);
    },
    enabled: !!id,
  });

const invalidateAllExerciseQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: platformKeys.libraryExercises.page() });
  queryClient.invalidateQueries({
    queryKey: [...platformKeys.root, "library-exercises"],
  });
};

export const useCreateLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseData) => api.libraryExercises.create(data),
    onSuccess: () => {
      invalidateAllExerciseQueries(queryClient);
      toast.success("Exercise created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create exercise");
    },
  });
};

export const useUpdateLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseData }) =>
      api.libraryExercises.update(id, data),
    onSuccess: (result: Exercise) => {
      invalidateAllExerciseQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: platformKeys.libraryExercises.byId(result.id) });
      toast.success("Exercise updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update exercise");
    },
  });
};

export const useDeleteLibraryExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.libraryExercises.delete(id),
    onSuccess: () => {
      invalidateAllExerciseQueries(queryClient);
      toast.success("Exercise deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete exercise");
    },
  });
};
