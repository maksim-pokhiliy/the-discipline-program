"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useResolveActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.coachActionItems.resolve(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachDashboard.data() });
      toast.success("Marked as contacted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve action item");
    },
  });
};
