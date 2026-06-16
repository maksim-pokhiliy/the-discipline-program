"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ResolveActionItemRequest } from "@repo/contracts/coaching/coach-action-item";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useResolveActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      reason,
      note,
    }: {
      itemId: string;
      reason?: ResolveActionItemRequest["reason"];
      note?: string;
      athleteId?: string;
    }) =>
      api.coachActionItems.resolve(itemId, { ...(reason && { reason }), ...(note && { note }) }),
    onSuccess: (_, { athleteId }) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.coachDashboard.data() });

      if (athleteId) {
        queryClient.invalidateQueries({
          queryKey: platformKeys.athletes.byId(athleteId),
        });
      }

      toast.success("Marked as contacted");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to resolve action item");
    },
  });
};
