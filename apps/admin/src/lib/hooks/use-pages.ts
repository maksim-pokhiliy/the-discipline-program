"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type UpdatePageSectionBody } from "@repo/contracts/cms/pages";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const usePagesListData = () =>
  useQuery({
    queryKey: adminKeys.pages.list(),
    queryFn: api.pages.getPages,
  });

const pageDetailsQuery = (slug: string) => ({
  queryKey: adminKeys.pages.bySlug(slug),
  queryFn: () => api.pages.getPageBySlug(slug),
});

export const usePageDetails = (slug: string) =>
  useQuery({
    ...pageDetailsQuery(slug),
    enabled: !!slug,
  });

export const useUpdatePageSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: UpdatePageSectionBody }) =>
      api.pages.updateSection(slug, body),

    onSuccess: async (_, { slug }) => {
      await queryClient
        .fetchQuery({ ...pageDetailsQuery(slug), staleTime: 0 })
        .catch(() => undefined);
      toast.success("Section updated successfully");
    },

    onError: (error: Error) => {
      notifyError(error, "Failed to update section");
    },
  });
};
