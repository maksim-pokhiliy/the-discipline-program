"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type UpdatePageSectionData } from "@repo/contracts/pages";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const usePagesListData = () =>
  useQuery({
    queryKey: adminKeys.pages.list(),
    queryFn: api.pages.getPages,
  });

export const usePageDetails = (slug: string) =>
  useQuery({
    queryKey: adminKeys.pages.bySlug(slug),
    queryFn: () => api.pages.getPageBySlug(slug),
    enabled: !!slug,
  });

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
