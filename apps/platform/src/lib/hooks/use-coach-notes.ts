"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateCoachNoteData } from "@repo/contracts/coaching/coach-note";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCoachNotes = (athleteId: string | null) => {
  return useQuery({
    queryKey: platformKeys.coachNotes.byAthlete(athleteId ?? ""),
    queryFn: () => api.coachNotes.list(athleteId ?? undefined),
    enabled: !!athleteId,
  });
};

export const useCreateCoachNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCoachNoteData) => api.coachNotes.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.coachNotes.byAthlete(data.athleteId),
      });
      toast.success("Note added");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to add note");
    },
  });
};

export const useDeleteCoachNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId }: { noteId: string; athleteId: string }) =>
      api.coachNotes.delete(noteId),
    onSuccess: (_, { athleteId }) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.coachNotes.byAthlete(athleteId),
      });
      toast.success("Note removed");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to remove note");
    },
  });
};
