"use client";

import type {
  CreateSchemaRequest,
  ReorderSchemasRequest,
  Schema,
  UpdateSchemaRequest,
} from "@repo/contracts/lms/schema";

import { api } from "../api";

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
