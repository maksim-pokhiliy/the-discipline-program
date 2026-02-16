import type { AdminUser, GetUsersPageDataResponse, UpdateUserRoleData } from "@repo/contracts/user";

import { apiClient } from "../client";

export const usersAPI = {
  getPageData: (): Promise<GetUsersPageDataResponse> =>
    apiClient.request("/api/admin/users/page-data"),

  getById: (id: string): Promise<AdminUser> => apiClient.request(`/api/admin/users/${id}`),

  updateRole: (id: string, data: UpdateUserRoleData): Promise<AdminUser> =>
    apiClient.request(`/api/admin/users/${id}`, "PUT", data),
};
