"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AdminProductsPageData,
  Product,
  CreateProductData,
  UpdateProductData,
} from "@repo/contracts/product";
import { adminKeys, createCrudHooks } from "@repo/query";

import { api } from "../api";

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
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useProductsPageData = productHooks.usePageData;
export const useProduct = productHooks.useById;
export const useCreateProduct = productHooks.useCreate;
export const useUpdateProduct = productHooks.useUpdate;
export const useDeleteProduct = productHooks.useDelete;

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.toggleStatus,
    onSuccess: () => {
      toast.success("Product status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};

export const useToggleProductFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.toggleFeatured,
    onSuccess: () => {
      toast.success("Featured status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update featured status");
    },
  });
};
