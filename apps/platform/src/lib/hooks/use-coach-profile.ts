"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CoachProfile, UpdateCoachProfileData } from "@repo/contracts/coach-profile";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachProfile = () =>
  useQuery({
    queryKey: platformKeys.coachProfile.me(),
    queryFn: () => api.coachProfile.get(),
  });

export const useUpdateCoachProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCoachProfileData) => api.coachProfile.update(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.coachProfile.me() });

      const previous = queryClient.getQueryData<CoachProfile>(platformKeys.coachProfile.me());

      if (previous) {
        queryClient.setQueryData(platformKeys.coachProfile.me(), { ...previous, ...data });
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(platformKeys.coachProfile.me(), context.previous);
      }

      toast.error("Failed to update profile");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachProfile.me() });
    },
  });
};
