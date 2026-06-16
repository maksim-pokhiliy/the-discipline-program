"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateExerciseData, Exercise } from "@repo/contracts/lms/exercise";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<Exercise, Error, CreateExerciseData>({
    mutationFn: (data) => api.exercises.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.exercises.all() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create exercise");
    },
  });
};
