"use client";

import type { AdminUser, GetUsersPageDataResponse, UpdateUserRoleData } from "@repo/contracts/user";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const userHooks = createCrudHooks<GetUsersPageDataResponse, AdminUser, never, UpdateUserRoleData>({
  entityName: "User",
  keys: adminKeys.users,
  api: {
    getPageData: api.users.getPageData,
    getById: api.users.getById,
    update: api.users.updateRole,
  },
  redirectTo: "/users",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useUsersPageData = userHooks.usePageData;
export const useUser = userHooks.useById;
export const useUpdateUserRole = userHooks.useUpdate;
