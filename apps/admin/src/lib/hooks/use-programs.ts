"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.programs.create,
    onSuccess: () => {
      toast.success("Program created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/programs");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create program");
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Program> }) =>
      api.programs.update(id, data),
    onSuccess: (data) => {
      toast.success("Program updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/programs");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update program");
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.programs.delete,
    onSuccess: () => {
      toast.success("Program deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete program");
    },
  });
};

export const useToggleProgramStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.programs.toggleStatus,
    onSuccess: () => {
      toast.success("Program status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.programs.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};
