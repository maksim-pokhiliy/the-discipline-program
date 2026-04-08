"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AdminUser, GetUsersPageDataResponse, UpdateUserRoleData } from "@repo/contracts/user";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const userHooks = createCrudHooks<GetUsersPageDataResponse, AdminUser>({
  entityName: "User",
  keys: adminKeys.users,
  api: {
    getPageData: api.users.getPageData,
    getById: api.users.getById,
  },
  redirectTo: "/users",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useUsersPageData = userHooks.usePageData;
export const useUser = userHooks.useById;

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRoleData }) =>
      api.users.updateRole(id, data),
    onSuccess: (data) => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.users.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });
};
