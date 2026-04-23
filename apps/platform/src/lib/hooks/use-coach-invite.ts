"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateCoachInviteData,
  ResendCoachInviteResponse,
} from "@repo/contracts/coaching/coach-invite";
import type { User } from "@repo/contracts/iam/user";
import { formatDate } from "@repo/shared";

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

export const useResendCoachInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<ResendCoachInviteResponse, Error, string>({
    mutationFn: (inviteeUserId) => api.coachInvite.resend(inviteeUserId),
    onSuccess: (result, inviteeUserId) => {
      const expiresAt =
        result.expiresAt instanceof Date ? result.expiresAt : new Date(result.expiresAt);

      toast.success(`Invite resent — expires at ${formatDate(expiresAt, "medium")}`);
      queryClient.invalidateQueries({ queryKey: platformKeys.athletes.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.athletes.byId(inviteeUserId) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invite");
    },
  });
};
