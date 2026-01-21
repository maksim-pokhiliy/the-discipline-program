"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  AdminStorefrontProgramsPageData,
  StorefrontProgram,
} from "@repo/contracts/storefront";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseStorefrontPageDataOptions {
  initialData?: AdminStorefrontProgramsPageData;
}

export const useStorefrontPageData = ({ initialData }: UseStorefrontPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.storefront.page(),
    queryFn: api.storefront.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useStorefrontProgram = (id: string) => {
  return useQuery({
    queryKey: adminKeys.storefront.byId(id),
    queryFn: () => api.storefront.getById(id),
    enabled: !!id,
  });
};

export const useCreateStorefrontProgram = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.storefront.create,
    onSuccess: () => {
      toast.success("Program created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.storefront.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/storefront");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create program");
    },
  });
};

export const useUpdateStorefrontProgram = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StorefrontProgram> }) =>
      api.storefront.update(id, data),
    onSuccess: (data) => {
      toast.success("Program updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.storefront.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.storefront.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/storefront");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update program");
    },
  });
};

export const useDeleteStorefrontProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.storefront.delete,
    onSuccess: () => {
      toast.success("Program deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.storefront.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete program");
    },
  });
};

export const useToggleStorefrontProgramStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.storefront.toggleStatus,
    onSuccess: () => {
      toast.success("Program status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.storefront.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};
