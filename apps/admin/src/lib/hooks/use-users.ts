"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateUserRoleData } from "@repo/contracts/iam/user";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const useUsersPageData = () =>
  useQuery({
    queryKey: adminKeys.users.page(),
    queryFn: api.users.getPageData,
  });

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
