import { type ApiClient } from "@repo/api-client";
import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminProductDetails,
  type AdminProduct,
  type AdminProductsPageData,
  type CreateProductData,
  ProductToggleField,
  type UpdateProductData,
  type UpdateProductTranslationBody,
} from "@repo/contracts/cms/product";

export const createProductsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminProductsPageData> =>
    client.request("/api/admin/products/page-data"),

  getById: (id: string, locale: LocaleCode): Promise<AdminProductDetails> =>
    client.request(`/api/admin/products/${id}?${new URLSearchParams({ locale })}`),

  saveTranslation: (id: string, data: UpdateProductTranslationBody): Promise<void> =>
    client.requestNoContent(`/api/admin/products/${id}/translations`, "PATCH", data),

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
