import { type ApiClient } from "@repo/api-client";
import {
  type AdminProfileAxesPageData,
  type CreateProfileAxisData,
  type ProfileAxis,
  type UpdateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";

export const createProfileAxesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminProfileAxesPageData> =>
    client.request("/api/admin/profile-axes/page-data"),

  getById: (id: string): Promise<ProfileAxis> => client.request(`/api/admin/profile-axes/${id}`),

  create: (data: CreateProfileAxisData): Promise<ProfileAxis> =>
    client.request("/api/admin/profile-axes", "POST", data),

  update: (id: string, data: UpdateProfileAxisData): Promise<ProfileAxis> =>
    client.request(`/api/admin/profile-axes/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/profile-axes/${id}`, "DELETE"),
});
