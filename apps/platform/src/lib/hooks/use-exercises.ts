"use client";

import type { CreateExerciseData, Exercise, UpdateExerciseData } from "@repo/contracts/exercise";
import { createCrudHooks, platformKeys } from "@repo/query";

import { api } from "../api";

const exerciseHooks = createCrudHooks<Exercise[], Exercise, CreateExerciseData, UpdateExerciseData>(
  {
    entityName: "Exercise",
    keys: platformKeys.exercises,
    api: {
      getPageData: api.exercises.getAll,
      getById: api.exercises.getById,
      create: api.exercises.create,
      update: api.exercises.update,
      delete: api.exercises.delete,
    },
    redirectTo: "/coach/exercises",
  },
);

export const useExercisesPageData = exerciseHooks.usePageData;
export const useExercise = exerciseHooks.useById;
export const useCreateExercise = exerciseHooks.useCreate;
export const useDeleteExercise = exerciseHooks.useDelete;
