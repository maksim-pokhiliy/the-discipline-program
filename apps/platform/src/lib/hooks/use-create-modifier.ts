"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateModifierData, Modifier } from "@repo/contracts/lms/modifier";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation<Modifier, Error, CreateModifierData>({
    mutationFn: (data) => api.modifiers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.modifiers.search() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create modifier");
    },
  });
};
