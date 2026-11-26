"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import type {
  AdminProductDetails,
  AdminProductsPageData,
  AdminProduct,
  CreateProductData,
  UpdateProductData,
  ProductTranslationWords,
} from "@repo/contracts/cms/product";
import { createCrudHooks, createToggleHook, notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { hasProductTranslationWords } from "./product-translation-words";
import { useNavigate } from "./use-navigate";

const productDetailsQuery = (id: string, locale: LocaleCode) => ({
  queryKey: adminKeys.products.detail(id, locale),
  queryFn: () => api.products.getById(id, locale),
});

const productHooks = createCrudHooks<
  AdminProductsPageData,
  AdminProduct,
  CreateProductData,
  UpdateProductData
>({
  entityName: "Product",
  keys: adminKeys.products,
  api: {
    getPageData: api.products.getPageData,
    getById: (id) => api.products.getById(id, DEFAULT_LOCALE_CODE),
    create: api.products.create,
    update: api.products.update,
    delete: api.products.delete,
  },
  redirectTo: "/products",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard(), adminKeys.locales.list()],
});

export const useProductsPageData = productHooks.usePageData;
export const useProduct = (
  id: string,
  locale: LocaleCode,
): UseQueryResult<AdminProductDetails, Error> =>
  useQuery({
    ...productDetailsQuery(id, locale),
    enabled: !!id,
  });
export const useCreateProduct = productHooks.useCreate;
export const useUpdateProduct = productHooks.useUpdate;
export const useDeleteProduct = productHooks.useDelete;

export const useSaveProductTranslation = (
  id: string,
  locale: LocaleCode,
): UseMutationResult<void, Error, ProductTranslationWords> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: adminKeys.products.translationSave(id, locale),
    mutationFn: (words: ProductTranslationWords) =>
      api.products.saveTranslation(id, { ...words, locale }),
    onSuccess: async (_, words) => {
      await queryClient.cancelQueries({
        queryKey: adminKeys.products.detail(id, locale),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.products.detail(id, locale),
        exact: true,
        refetchType: "none",
      });
      await queryClient
        .fetchQuery({ ...productDetailsQuery(id, locale), staleTime: 0 })
        .catch(() => undefined);
      void queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
      toast.success(
        hasProductTranslationWords(words) ? "Translation saved" : "Translation cleared",
      );
    },
    onError: (error: Error) => notifyError(error, "Failed to save the translation"),
  });
};

export const useToggleProductStatus = createToggleHook({
  mutationFn: api.products.toggleStatus,
  successMessage: "Product status updated",
  errorMessage: "Failed to update status",
  invalidateKeys: [adminKeys.products.page(), adminKeys.dashboard(), adminKeys.locales.list()],
});

export const useToggleProductFeatured = createToggleHook({
  mutationFn: api.products.toggleFeatured,
  successMessage: "Featured product updated",
  errorMessage: "Failed to update featured product",
  invalidateKeys: [adminKeys.products.page(), adminKeys.dashboard()],
});
