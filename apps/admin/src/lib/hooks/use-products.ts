"use client";

import type {
  AdminProductsPageData,
  Product,
  CreateProductData,
  UpdateProductData,
} from "@repo/contracts/product";
import { adminKeys, createCrudHooks, createToggleHook } from "@repo/query";

import { api } from "../api";

import { useNavigate } from "./use-navigate";

const productHooks = createCrudHooks<
  AdminProductsPageData,
  Product,
  CreateProductData,
  UpdateProductData
>({
  entityName: "Product",
  keys: adminKeys.products,
  api: {
    getPageData: api.products.getPageData,
    getById: api.products.getById,
    create: api.products.create,
    update: api.products.update,
    delete: api.products.delete,
  },
  redirectTo: "/products",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useProductsPageData = productHooks.usePageData;
export const useProduct = productHooks.useById;
export const useCreateProduct = productHooks.useCreate;
export const useUpdateProduct = productHooks.useUpdate;
export const useDeleteProduct = productHooks.useDelete;

export const useToggleProductStatus = createToggleHook({
  mutationFn: api.products.toggleStatus,
  successMessage: "Product status updated",
  errorMessage: "Failed to update status",
  invalidateKeys: [adminKeys.products.page(), adminKeys.dashboard()],
});

export const useToggleProductFeatured = createToggleHook({
  mutationFn: api.products.toggleFeatured,
  successMessage: "Featured status updated",
  errorMessage: "Failed to update featured status",
  invalidateKeys: [adminKeys.products.page(), adminKeys.dashboard()],
});
