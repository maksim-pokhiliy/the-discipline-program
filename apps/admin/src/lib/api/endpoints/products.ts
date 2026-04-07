import { type ApiClient } from "@repo/api-client";
import {
  type Product,
  type AdminProductsPageData,
  type CreateProductData,
  type UpdateProductData,
} from "@repo/contracts/product";

export const createProductsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminProductsPageData> =>
    client.request("/api/admin/products/page-data"),

  getAll: (): Promise<Product[]> => client.request("/api/admin/products"),

  getById: (id: string): Promise<Product> => client.request(`/api/admin/products/${id}`),

  create: (data: CreateProductData): Promise<Product> =>
    client.request("/api/admin/products", "POST", data),

  update: (id: string, data: UpdateProductData): Promise<Product> =>
    client.request(`/api/admin/products/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/products/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<Product> =>
    client.request(`/api/admin/products/${id}/toggle?field=isActive`, "PATCH"),

  toggleFeatured: (id: string): Promise<Product> =>
    client.request(`/api/admin/products/${id}/toggle?field=isFeatured`, "PATCH"),
});
