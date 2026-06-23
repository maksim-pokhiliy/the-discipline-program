"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateProfileAxisData, ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreateProfileAxis = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileAxis, Error, CreateProfileAxisData>({
    mutationFn: (data) => api.profileAxes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.profileAxes.all() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create profile axis");
    },
  });
};
