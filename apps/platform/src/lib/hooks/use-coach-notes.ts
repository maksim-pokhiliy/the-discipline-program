"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateCoachNoteData } from "@repo/contracts/coaching/coach-note";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreateCoachNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCoachNoteData) => api.coachNotes.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.athletes.byId(data.athleteId),
      });
      toast.success("Note added");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to add note");
    },
  });
};
