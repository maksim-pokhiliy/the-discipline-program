"use client";

import {
  type AdminDayTypesPageData,
  type CreateDayTypeData,
  type DayType,
  type UpdateDayTypeData,
} from "@repo/contracts/lms/day-type";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const dayTypeHooks = createCrudHooks<
  AdminDayTypesPageData,
  DayType,
  CreateDayTypeData,
  UpdateDayTypeData
>({
  entityName: "DayType",
  keys: adminKeys.dayTypes,
  api: {
    getPageData: api.dayTypes.getPageData,
    getById: api.dayTypes.getById,
    create: api.dayTypes.create,
    update: api.dayTypes.update,
    delete: api.dayTypes.delete,
  },
  redirectTo: "/day-types",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useDayTypesPageData = dayTypeHooks.usePageData;
export const useDayType = dayTypeHooks.useById;
export const useCreateDayType = dayTypeHooks.useCreate;
export const useUpdateDayType = dayTypeHooks.useUpdate;
export const useDeleteDayType = dayTypeHooks.useDelete;
