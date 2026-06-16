"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateCoachCredentialData,
  UpdateCoachCredentialData,
} from "@repo/contracts/coaching/coach-credential";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreateCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCoachCredentialData) => api.coachCredentials.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachProfile.data() });
      toast.success("Credential added");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to add credential");
    },
  });
};

export const useUpdateCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachCredentialData }) =>
      api.coachCredentials.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachProfile.data() });
      toast.success("Credential updated");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to update credential");
    },
  });
};

export const useDeleteCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.coachCredentials.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachProfile.data() });
      toast.success("Credential removed");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to remove credential");
    },
  });
};
