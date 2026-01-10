"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminProgramsPageData, Program } from "@repo/contracts/program";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseProgramsPageDataOptions {
  initialData?: AdminProgramsPageData;
}

export const useProgramsPageData = ({ initialData }: UseProgramsPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.programs.page(),
    queryFn: api.programs.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useProgram = (id: string) => {
  return useQuery({
    queryKey: adminKeys.programs.byId(id),
    queryFn: () => api.programs.getById(id),
    enabled: !!id,
  });
};

export const useProgramMutations = () => {
  const queryClient = useQueryClient();

  const createProgram = useMutation({
    mutationFn: api.programs.create,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Program> }) =>
      api.programs.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const deleteProgram = useMutation({
    mutationFn: api.programs.delete,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: api.programs.toggleStatus,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    toggleStatus,
  };
};
