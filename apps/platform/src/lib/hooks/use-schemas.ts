"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import type {
  CreateSchemaRequest,
  ReorderSchemasRequest,
  Schema,
  UpdateSchemaRequest,
} from "@repo/contracts/lms/schema";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateSchema = (planId: string, startDate: string) =>
  useWeekMutation<CreateSchemaRequest, Schema>({
    mutationFn: (data) => api.schemas.create(planId, data),
    planId,
    startDate,
    successMessage: "Schema created",
    errorMessage: "Failed to create schema",
  });

export const useUpdateSchema = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaId: string; data: UpdateSchemaRequest }, Schema>({
    mutationFn: ({ schemaId, data }) => api.schemas.update(planId, schemaId, data),
    planId,
    startDate,
    successMessage: "Schema updated",
    errorMessage: "Failed to update schema",
  });

export const useDeleteSchema = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaId: string }, void>({
    mutationFn: ({ schemaId }) => api.schemas.delete(planId, schemaId),
    planId,
    startDate,
    successMessage: "Schema deleted",
    errorMessage: "Failed to delete schema",
  });

export const useReorderSchemas = (planId: string, startDate: string) =>
  useWeekMutation<ReorderSchemasRequest, { schemas: Schema[] }>({
    mutationFn: (data) => api.schemas.reorder(planId, data),
    planId,
    startDate,
    successMessage: "Schemas reordered",
    errorMessage: "Failed to reorder schemas",
  });

export const useDuplicateSchema = (
  planId: string,
  startDate: string,
): UseMutationResult<Schema, Error, { schemaId: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schemaId }) => api.schemas.duplicate(planId, schemaId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
    },
    onError: (error: Error) => {
      notifyError(error, "Couldn't duplicate — try again.");
    },
  });
};
