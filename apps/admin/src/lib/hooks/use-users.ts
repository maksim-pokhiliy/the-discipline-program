"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateUserData,
  GetUsersPageDataResponse,
  UpdateUserData,
  UpdateUserRoleData,
  User,
} from "@repo/contracts/iam/user";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const userHooks = createCrudHooks<GetUsersPageDataResponse, User, CreateUserData, UpdateUserData>({
  entityName: "User",
  keys: adminKeys.users,
  api: {
    getPageData: api.users.getPageData,
    getById: api.users.getById,
    create: api.users.create,
    update: api.users.update,
    delete: api.users.delete,
  },
  redirectTo: "/users",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useUsersPageData = userHooks.usePageData;
export const useCreateUser = userHooks.useCreate;
export const useUpdateUser = userHooks.useUpdate;
export const useDeleteUser = userHooks.useDelete;

export const useUser = (id: string) =>
  useQuery({
    queryKey: adminKeys.users.byId(id),
    queryFn: () => api.users.getById(id),
    enabled: !!id,
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRoleData }) =>
      api.users.updateRole(id, data),
    onSuccess: (_, { id }) => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.users.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.byId(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });
};
