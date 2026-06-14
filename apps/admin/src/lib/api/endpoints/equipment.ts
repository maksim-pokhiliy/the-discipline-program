import { type ApiClient } from "@repo/api-client";
import {
  type AdminEquipmentPageData,
  type CreateEquipmentData,
  type Equipment,
  type UpdateEquipmentData,
} from "@repo/contracts/lms/equipment";

export const createEquipmentAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminEquipmentPageData> =>
    client.request("/api/admin/equipment/page-data"),

  getById: (id: string): Promise<Equipment> => client.request(`/api/admin/equipment/${id}`),

  create: (data: CreateEquipmentData): Promise<Equipment> =>
    client.request("/api/admin/equipment", "POST", data),

  update: (id: string, data: UpdateEquipmentData): Promise<Equipment> =>
    client.request(`/api/admin/equipment/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/equipment/${id}`, "DELETE"),
});
