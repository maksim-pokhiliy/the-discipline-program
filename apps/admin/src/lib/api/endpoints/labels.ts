import { type ApiClient } from "@repo/api-client";
import {
  type AdminLabelsPageData,
  type CreateLabelData,
  type Label,
  type UpdateLabelData,
} from "@repo/contracts/cms/label";

export const createLabelsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminLabelsPageData> => client.request("/api/admin/labels/page-data"),

  getById: (id: string): Promise<Label> => client.request(`/api/admin/labels/${id}`),

  create: (data: CreateLabelData): Promise<Label> =>
    client.request("/api/admin/labels", "POST", data),

  update: (id: string, data: UpdateLabelData): Promise<Label> =>
    client.request(`/api/admin/labels/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/labels/${id}`, "DELETE"),
});
