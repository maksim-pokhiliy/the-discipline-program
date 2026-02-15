"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  AdminExercisesPageData,
  Exercise,
  UpdateExerciseData,
} from "@repo/contracts/exercise";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseExercisesPageDataOptions {
  initialData?: AdminExercisesPageData;
}

export const useExercisesPageData = ({ initialData }: UseExercisesPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.exercises.page(),
    queryFn: api.exercises.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useExercise = (id: string, initialData?: Exercise) => {
  return useQuery({
    queryKey: adminKeys.exercises.byId(id),
    queryFn: () => api.exercises.getById(id),
    initialData,
    enabled: !!id,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useCreateExercise = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.exercises.create,
    onSuccess: () => {
      toast.success("Exercise created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/exercises");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create exercise");
    },
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseData }) =>
      api.exercises.update(id, data),
    onSuccess: (data) => {
      toast.success("Exercise updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/exercises");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update exercise");
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.exercises.delete,
    onSuccess: () => {
      toast.success("Exercise deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.exercises.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete exercise");
    },
  });
};
