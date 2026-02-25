import { type ApiClient } from "@repo/api-client";
import { type Product, type AdminProductsPageData } from "@repo/contracts/product";

export const createProductsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminProductsPageData> =>
    client.request("/api/admin/products/page-data"),

  getAll: (): Promise<Product[]> => client.request("/api/admin/products"),

  getById: (id: string): Promise<Product> => client.request(`/api/admin/products/${id}`),

  create: (data: Partial<Product>): Promise<Product> =>
    client.request("/api/admin/products", "POST", data),

  update: (id: string, data: Partial<Product>): Promise<Product> =>
    client.request(`/api/admin/products/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/products/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<Product> =>
    client.request(`/api/admin/products/${id}/toggle`, "PATCH"),
});
