import { type ApiClient } from "@repo/api-client";
import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import type { GetUsersPageDataResponse, UpdateUserRoleData } from "@repo/contracts/iam/user";

export const createUsersAPI = (client: ApiClient) => ({
  getPageData: (): Promise<GetUsersPageDataResponse> =>
    client.request("/api/admin/users/page-data"),

  getById: (id: string): Promise<AdminUserView> => client.request(`/api/admin/users/${id}`),

  updateRole: (id: string, data: UpdateUserRoleData): Promise<void> =>
    client.request(`/api/admin/users/${id}`, "PUT", data),
});
