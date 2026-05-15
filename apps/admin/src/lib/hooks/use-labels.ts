"use client";

import {
  type AdminLabelsPageData,
  type CreateLabelData,
  type Label,
  type UpdateLabelData,
} from "@repo/contracts/cms/label";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const labelHooks = createCrudHooks<AdminLabelsPageData, Label, CreateLabelData, UpdateLabelData>({
  entityName: "Label",
  keys: adminKeys.labels,
  api: {
    getPageData: api.labels.getPageData,
    getById: api.labels.getById,
    create: api.labels.create,
    update: api.labels.update,
    delete: api.labels.delete,
  },
  redirectTo: "/labels",
  useNavigate,
});

export const useLabelsPageData = labelHooks.usePageData;
export const useLabel = labelHooks.useById;
export const useCreateLabel = labelHooks.useCreate;
export const useUpdateLabel = labelHooks.useUpdate;
export const useDeleteLabel = labelHooks.useDelete;
