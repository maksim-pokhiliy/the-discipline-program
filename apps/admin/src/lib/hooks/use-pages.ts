"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

export const usePagesList = () => {
  return useQuery({
    queryKey: adminKeys.pages.list(),
    queryFn: api.pages.getList,
    staleTime: STALE_TIMES.LONG,
  });
};

export const usePageSections = (slug: string) => {
  return useQuery({
    queryKey: adminKeys.pages.sections(slug),
    queryFn: () => api.pages.getSections(slug),
    enabled: !!slug,
  });
};

export const useUpdateSection = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: unknown }) =>
      api.pages.updateSection(slug, section, data),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.pages.sections(slug) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update section");
    },
  });
};
