import { type ApiClient } from "@repo/api-client";
import {
  type AdminProduct,
  type AdminProductsPageData,
  type CreateProductData,
  ProductToggleField,
  type UpdateProductData,
} from "@repo/contracts/cms/product";

export const createProductsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminProductsPageData> =>
    client.request("/api/admin/products/page-data"),

  getById: (id: string): Promise<AdminProduct> => client.request(`/api/admin/products/${id}`),

  create: (data: CreateProductData): Promise<AdminProduct> =>
    client.request("/api/admin/products", "POST", data),

  update: (id: string, data: UpdateProductData): Promise<AdminProduct> =>
    client.request(`/api/admin/products/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/products/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<AdminProduct> =>
    client.request(
      `/api/admin/products/${id}/toggle?field=${ProductToggleField.IS_ACTIVE}`,
      "PATCH",
    ),

  toggleFeatured: (id: string): Promise<AdminProduct> =>
    client.request(
      `/api/admin/products/${id}/toggle?field=${ProductToggleField.IS_FEATURED}`,
      "PATCH",
    ),
});
