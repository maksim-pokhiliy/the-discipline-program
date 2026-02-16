"use client";

import type {
  AdminExercisesPageData,
  CreateExerciseData,
  Exercise,
  UpdateExerciseData,
} from "@repo/contracts/exercise";
import { adminKeys } from "@repo/query";

import { api } from "../api";

import { createCrudHooks } from "./create-crud-hooks";

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
});

export const useExercisesPageData = exerciseHooks.usePageData;
export const useExercise = exerciseHooks.useById;
export const useCreateExercise = exerciseHooks.useCreate;
export const useUpdateExercise = exerciseHooks.useUpdate;
export const useDeleteExercise = exerciseHooks.useDelete;
