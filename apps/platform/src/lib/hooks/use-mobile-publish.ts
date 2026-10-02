"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const TRAINING_LEVELS_STALE_TIME_MS = 5 * 60_000;
const MOBILE_ATHLETES_STALE_TIME_MS = 5 * 60_000;

export const useTrainingLevels = () =>
  useQuery({
    queryKey: platformKeys.mobile.trainingLevels(),
    queryFn: () => api.mobile.listTrainingLevels(),
    staleTime: TRAINING_LEVELS_STALE_TIME_MS,
  });

export const useMobileAthletes = (planId: string) =>
  useQuery({
    queryKey: platformKeys.mobile.athletes(planId),
    queryFn: () => api.mobile.listAthletes(planId),
    enabled: Boolean(planId),
    staleTime: MOBILE_ATHLETES_STALE_TIME_MS,
  });

export const useMobileLinks = (planId: string, weekStart?: string) =>
  useQuery({
    queryKey: platformKeys.mobile.links(planId, weekStart),
    queryFn: () => api.mobile.listLinks(planId, weekStart),
    enabled: Boolean(planId),
    placeholderData: keepPreviousData,
  });

export const useCreateMobileLink = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.mobile.createLink,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });
    },
    onSuccess: () => {
      toast.success("Linked");
    },
    onError: (error: Error, variables) => {
      notifyError(
        error,
        "channel" in variables ? "Failed to link athlete" : "Failed to link training level",
      );
    },
  });
};

export const useDeleteMobileLink = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => api.mobile.deleteLink(linkId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });
    },
    onSuccess: () => {
      toast.success("Unlinked");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to unlink training level");
    },
  });
};

export const usePublishMobile = () =>
  useMutation({
    mutationFn: api.mobile.publish,
  });
