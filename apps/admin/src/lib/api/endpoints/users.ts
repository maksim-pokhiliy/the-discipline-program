import { type ApiClient } from "@repo/api-client";
import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import type {
  CreateUserData,
  GetUsersPageDataResponse,
  UpdateUserData,
  UpdateUserRoleData,
  User,
} from "@repo/contracts/iam/user";

export const createUsersAPI = (client: ApiClient) => ({
  getPageData: (): Promise<GetUsersPageDataResponse> =>
    client.request("/api/admin/users/page-data"),

  getById: (id: string): Promise<AdminUserView> => client.request(`/api/admin/users/${id}`),

  updateRole: (id: string, data: UpdateUserRoleData): Promise<void> =>
    client.request(`/api/admin/users/${id}`, "PUT", data),

  create: (data: CreateUserData): Promise<User> => client.request("/api/admin/users", "POST", data),

  update: (id: string, data: UpdateUserData): Promise<User> =>
    client.request(`/api/admin/users/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/users/${id}`, "DELETE"),
});
