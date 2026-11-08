"use client";

import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  type AdminPageListItem,
  type SectionWriteBody,
} from "@repo/contracts/cms/pages";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const usePagesListData = (locale: LocaleCode): UseQueryResult<AdminPageListItem[], Error> =>
  useQuery({
    queryKey: adminKeys.pages.list(locale),
    queryFn: () => api.pages.getPages(locale),
  });

const pageDetailsQuery = (slug: string, locale: LocaleCode) => ({
  queryKey: adminKeys.pages.detail(slug, locale),
  queryFn: () => api.pages.getPageBySlug(slug, locale),
});

export const usePageDetails = (
  slug: string,
  locale: LocaleCode,
): UseQueryResult<AdminPageDetails, Error> =>
  useQuery({
    ...pageDetailsQuery(slug, locale),
    enabled: !!slug,
  });

export const useIsPageSectionSaving = (slug: string, locale: LocaleCode): boolean =>
  useIsMutating({ mutationKey: adminKeys.pages.sectionSave(slug, locale) }) > 0;

const isEmptySectionData = (data: SectionWriteBody["data"]): boolean =>
  Object.keys(data).length === 0;

export const useUpdatePageSection = (
  slug: string,
  locale: LocaleCode,
): UseMutationResult<void, Error, SectionWriteBody> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: adminKeys.pages.sectionSave(slug, locale),
    mutationFn: (body: SectionWriteBody) => api.pages.updateSection(slug, { ...body, locale }),

    onSuccess: async (_, body) => {
      if (locale === DEFAULT_LOCALE_CODE) {
        await queryClient.invalidateQueries({
          queryKey: adminKeys.pages.details(slug),
          refetchType: "none",
        });
      }

      await queryClient
        .fetchQuery({ ...pageDetailsQuery(slug, locale), staleTime: 0 })
        .catch(() => undefined);

      if (locale !== DEFAULT_LOCALE_CODE) {
        void queryClient.invalidateQueries({ queryKey: adminKeys.pages.list(locale) });
        void queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
      }

      toast.success(
        isEmptySectionData(body.data) ? "Translation cleared" : "Section updated successfully",
      );
    },

    onError: (error: Error) => {
      notifyError(error, "Failed to update section");
    },
  });
};
