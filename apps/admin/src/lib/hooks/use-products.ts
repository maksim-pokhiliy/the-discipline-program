"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AdminProductsPageData, Product } from "@repo/contracts/product";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseProductsPageDataOptions {
  initialData?: AdminProductsPageData;
}

export const useProductsPageData = ({ initialData }: UseProductsPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.products.page(),
    queryFn: api.products.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useProduct = (id: string, initialData?: Product) => {
  return useQuery({
    queryKey: adminKeys.products.byId(id),
    queryFn: () => api.products.getById(id),
    initialData,
    enabled: !!id,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/products");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.products.update(id, data),
    onSuccess: (data) => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.products.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/products");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.delete,
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
};

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.toggleStatus,
    onSuccess: () => {
      toast.success("Product status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.products.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};
