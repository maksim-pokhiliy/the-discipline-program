import { type ApiClient } from "@repo/api-client";
import {
  type AdminDayTypesPageData,
  type CreateDayTypeData,
  type DayType,
  type UpdateDayTypeData,
} from "@repo/contracts/lms/day-type";

export const createDayTypesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminDayTypesPageData> =>
    client.request("/api/admin/day-types/page-data"),

  getById: (id: string): Promise<DayType> => client.request(`/api/admin/day-types/${id}`),

  create: (data: CreateDayTypeData): Promise<DayType> =>
    client.request("/api/admin/day-types", "POST", data),

  update: (id: string, data: UpdateDayTypeData): Promise<DayType> =>
    client.request(`/api/admin/day-types/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/day-types/${id}`, "DELETE"),
});
