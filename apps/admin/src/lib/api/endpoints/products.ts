import {
  type Product,
  type ProductsStats,
  type AdminProductsPageData,
} from "@repo/contracts/product";

import { apiClient } from "../client";

export const productsAPI = {
  getPageData: (): Promise<AdminProductsPageData> =>
    apiClient.request("/api/admin/products/page-data"),

  getAll: (): Promise<Product[]> => apiClient.request("/api/admin/products"),

  getById: (id: string): Promise<Product> => apiClient.request(`/api/admin/products/${id}`),

  getStats: (): Promise<ProductsStats> => apiClient.request("/api/admin/products/stats"),

  create: (data: Partial<Product>): Promise<Product> =>
    apiClient.request("/api/admin/products", "POST", data),

  update: (id: string, data: Partial<Product>): Promise<Product> =>
    apiClient.request(`/api/admin/products/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/products/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<Product> =>
    apiClient.request(`/api/admin/products/${id}/toggle`, "PATCH"),
};
