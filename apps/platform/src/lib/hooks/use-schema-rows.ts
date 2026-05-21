"use client";

import type {
  CreateSchemaRowRequest,
  ReorderSchemaRowsRequest,
  SchemaRow,
  UpdateSchemaRowRequest,
} from "@repo/contracts/lms/schema-row";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<CreateSchemaRowRequest, SchemaRow>({
    mutationFn: (data) => api.schemaRows.create(planId, data),
    planId,
    startDate,
    successMessage: "Schema row created",
    errorMessage: "Failed to create schema row",
  });

export const useUpdateSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaRowId: string; data: UpdateSchemaRowRequest }, SchemaRow>({
    mutationFn: ({ schemaRowId, data }) => api.schemaRows.update(planId, schemaRowId, data),
    planId,
    startDate,
    successMessage: "Schema row updated",
    errorMessage: "Failed to update schema row",
  });

export const useDeleteSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaRowId: string }, void>({
    mutationFn: ({ schemaRowId }) => api.schemaRows.delete(planId, schemaRowId),
    planId,
    startDate,
    successMessage: "Schema row deleted",
    errorMessage: "Failed to delete schema row",
  });

export const useReorderSchemaRows = (planId: string, startDate: string) =>
  useWeekMutation<ReorderSchemaRowsRequest, { schemaRows: SchemaRow[] }>({
    mutationFn: (data) => api.schemaRows.reorder(planId, data),
    planId,
    startDate,
    successMessage: "Schema rows reordered",
    errorMessage: "Failed to reorder schema rows",
  });
