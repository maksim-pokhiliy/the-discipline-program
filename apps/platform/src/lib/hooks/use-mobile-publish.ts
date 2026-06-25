"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const TRAINING_LEVELS_STALE_TIME_MS = 5 * 60_000;

export const useMobileConnections = () =>
  useQuery({
    queryKey: platformKeys.mobile.connections(),
    queryFn: () => api.mobile.listConnections(),
  });

export const useTrainingLevels = (enabled: boolean) =>
  useQuery({
    queryKey: platformKeys.mobile.trainingLevels(),
    queryFn: () => api.mobile.listTrainingLevels(),
    enabled,
    staleTime: TRAINING_LEVELS_STALE_TIME_MS,
  });

export const useMobileLinks = (planId: string) =>
  useQuery({
    queryKey: platformKeys.mobile.links(planId),
    queryFn: () => api.mobile.listLinks(planId),
    enabled: Boolean(planId),
  });

export const useConnectMobile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.mobile.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.connections() });
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.trainingLevels() });
      toast.success("Mobile app connected");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to connect mobile app");
    },
  });
};

export const useCreateMobileLink = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.mobile.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });
      toast.success("Linked");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to link training level");
    },
  });
};

export const useDeleteMobileLink = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => api.mobile.deleteLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.mobile.links(planId) });
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
