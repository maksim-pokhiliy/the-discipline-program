"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateOneRMRecordRequest } from "@repo/contracts/lms/one-rm-record";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useOneRMRecords = (exerciseId?: string) =>
  useQuery({
    queryKey: platformKeys.oneRMRecords.list(exerciseId),
    queryFn: () => api.oneRMRecords.list(exerciseId),
  });

export const useCreateOneRMRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOneRMRecordRequest) => api.oneRMRecords.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
      toast.success("1RM saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save 1RM");
    },
  });
};
