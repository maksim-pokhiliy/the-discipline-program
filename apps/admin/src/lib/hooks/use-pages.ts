"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type PageSectionDto,
  type PageSlug,
  type SectionData,
  type SectionKey,
} from "@repo/contracts/pages";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

type UpdateSectionVariables<P extends PageSlug> = {
  [S in SectionKey<P>]: {
    section: S;
    data: SectionData<P, S>;
  };
}[SectionKey<P>];

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

export const useUpdateSection = <P extends PageSlug>(slug: P) => {
  const queryClient = useQueryClient();

  return useMutation<PageSectionDto, Error, UpdateSectionVariables<P>>({
    mutationFn: ({ section, data }) => {
      return api.pages.updateSection(slug, section, data);
    },
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({
        queryKey: adminKeys.pages.sections(slug),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update section");
    },
  });
};
