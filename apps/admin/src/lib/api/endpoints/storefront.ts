import {
  type StorefrontProgram,
  type StorefrontProgramsStats,
  type AdminStorefrontProgramsPageData,
} from "@repo/contracts/storefront";

import { apiClient } from "../client";

export const storefrontAPI = {
  getPageData: (): Promise<AdminStorefrontProgramsPageData> =>
    apiClient.request("/api/admin/storefront/page-data"),

  getAll: (): Promise<StorefrontProgram[]> => apiClient.request("/api/admin/storefront"),

  getById: (id: string): Promise<StorefrontProgram> =>
    apiClient.request(`/api/admin/storefront/${id}`),

  getStats: (): Promise<StorefrontProgramsStats> =>
    apiClient.request("/api/admin/storefront/stats"),

  create: (data: Partial<StorefrontProgram>): Promise<StorefrontProgram> =>
    apiClient.request("/api/admin/storefront", "POST", data),

  update: (id: string, data: Partial<StorefrontProgram>): Promise<StorefrontProgram> =>
    apiClient.request(`/api/admin/storefront/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/storefront/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<StorefrontProgram> =>
    apiClient.request(`/api/admin/storefront/${id}/toggle`, "PATCH"),
};
