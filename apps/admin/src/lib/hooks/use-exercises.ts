"use client";

import { useQuery } from "@tanstack/react-query";

import {
  type AdminExercisesPageData,
  type CreateExerciseData,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/lms/exercise";
import { createCrudHooks, STALE_TIMES } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const exerciseHooks = createCrudHooks<
  AdminExercisesPageData,
  Exercise,
  CreateExerciseData,
  UpdateExerciseData
>({
  entityName: "Exercise",
  keys: adminKeys.exercises,
  api: {
    getPageData: api.exercises.getPageData,
    getById: api.exercises.getById,
    create: api.exercises.create,
    update: api.exercises.update,
    delete: api.exercises.delete,
  },
  redirectTo: "/exercises",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.exercises.movementFamilies()],
});

export const useExercisesPageData = exerciseHooks.usePageData;
export const useExercise = exerciseHooks.useById;
export const useCreateExercise = exerciseHooks.useCreate;
export const useUpdateExercise = exerciseHooks.useUpdate;
export const useDeleteExercise = exerciseHooks.useDelete;

export const useMovementFamilies = () =>
  useQuery({
    queryKey: adminKeys.exercises.movementFamilies(),
    queryFn: api.exercises.getMovementFamilies,
    staleTime: STALE_TIMES.FIVE_MINUTES,
  });
