"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateLabelData, Label } from "@repo/contracts/lms/label";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const LABEL_SEARCH_PREFIX = [...platformKeys.root, "labels", "search"] as const;

export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation<Label, Error, CreateLabelData>({
    mutationFn: (data) => api.labels.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABEL_SEARCH_PREFIX });
    },
    onError: (error) => {
      notifyError(error, "Failed to create label");
    },
  });
};
