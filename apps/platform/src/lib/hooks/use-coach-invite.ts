"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateCoachInviteData } from "@repo/contracts/coaching/coach-invite";
import type { User } from "@repo/contracts/iam/user";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useInviteAthlete = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateCoachInviteData>({
    mutationFn: (data) => api.coachInvite.create(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.athletes.page() });
      toast.success(`Invite sent to ${user.email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invite");
    },
  });
};
