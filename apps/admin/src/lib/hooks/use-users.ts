"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ResendInviteResponse } from "@repo/contracts/iam/invite-token";
import type {
  CreateUserData,
  GetUsersPageDataResponse,
  UpdateUserData,
  UpdateUserRoleData,
  User,
} from "@repo/contracts/iam/user";
import { createCrudHooks, notifyError } from "@repo/query";
import { formatDate } from "@repo/shared";

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
  additionalInvalidateKeys: [adminKeys.dashboard(), adminKeys.users.coaches()],
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

export const useCoachesList = () =>
  useQuery({
    queryKey: adminKeys.users.coaches(),
    queryFn: api.users.getCoaches,
    staleTime: 5 * 60_000,
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
      queryClient.invalidateQueries({ queryKey: adminKeys.users.coaches() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to update user");
    },
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<ResendInviteResponse, Error, string>({
    mutationFn: (id) => api.users.resendInvite(id),
    onSuccess: (result, id) => {
      const expiresAt =
        result.expiresAt instanceof Date ? result.expiresAt : new Date(result.expiresAt);

      toast.success(`Invite resent — expires at ${formatDate(expiresAt, "medium")}`);
      queryClient.invalidateQueries({ queryKey: adminKeys.users.byId(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to resend invite");
    },
  });
};
