import { type ApiClient } from "@repo/api-client";
import type { AdminUser, GetUsersPageDataResponse, UpdateUserRoleData } from "@repo/contracts/user";

export const createUsersAPI = (client: ApiClient) => ({
  getPageData: (): Promise<GetUsersPageDataResponse> =>
    client.request("/api/admin/users/page-data"),

  getById: (id: string): Promise<AdminUser> => client.request(`/api/admin/users/${id}`),

  updateRole: (id: string, data: UpdateUserRoleData): Promise<AdminUser> =>
    client.request(`/api/admin/users/${id}`, "PUT", data),
});
