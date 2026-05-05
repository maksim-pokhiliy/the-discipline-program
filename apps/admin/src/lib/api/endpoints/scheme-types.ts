import { type ApiClient } from "@repo/api-client";
import {
  type AdminSchemeTypesPageData,
  type CreateSchemeTypeData,
  type SchemeType,
  type UpdateSchemeTypeData,
} from "@repo/contracts/lms/scheme-type";

export const createSchemeTypesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminSchemeTypesPageData> =>
    client.request("/api/admin/scheme-types/page-data"),

  getById: (id: string): Promise<SchemeType> => client.request(`/api/admin/scheme-types/${id}`),

  create: (data: CreateSchemeTypeData): Promise<SchemeType> =>
    client.request("/api/admin/scheme-types", "POST", data),

  update: (id: string, data: UpdateSchemeTypeData): Promise<SchemeType> =>
    client.request(`/api/admin/scheme-types/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/scheme-types/${id}`, "DELETE"),
});
