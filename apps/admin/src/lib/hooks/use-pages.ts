"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
} from "@repo/contracts/pages";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UsePagesListDataOptions {
  initialData?: AdminPageListItem[];
}

interface UsePageDetailsOptions {
  initialData?: AdminPageDetails;
}

export const usePagesListData = ({ initialData }: UsePagesListDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.pages.list(),
    queryFn: api.pages.getPages,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const usePageDetails = (slug: string, { initialData }: UsePageDetailsOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.pages.bySlug(slug),
    queryFn: () => api.pages.getPageBySlug(slug),
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
    enabled: !!slug,
  });
};

export const useUpdatePageSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Omit<UpdatePageSectionData, "pageSlug"> }) =>
      api.pages.updateSection(slug, data),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pages.bySlug(slug) });
      toast.success("Section updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update section");
    },
  });
};
