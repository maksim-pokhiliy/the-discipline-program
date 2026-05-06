"use client";

import {
  type AdminSchemeTypesPageData,
  type CreateSchemeTypeData,
  type SchemeType,
  type UpdateSchemeTypeData,
} from "@repo/contracts/lms/scheme-type";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const schemeTypeHooks = createCrudHooks<
  AdminSchemeTypesPageData,
  SchemeType,
  CreateSchemeTypeData,
  UpdateSchemeTypeData
>({
  entityName: "SchemeType",
  keys: adminKeys.schemeTypes,
  api: {
    getPageData: api.schemeTypes.getPageData,
    getById: api.schemeTypes.getById,
    create: api.schemeTypes.create,
    update: api.schemeTypes.update,
    delete: api.schemeTypes.delete,
  },
  redirectTo: "/scheme-types",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useSchemeTypesPageData = schemeTypeHooks.usePageData;
export const useSchemeType = schemeTypeHooks.useById;
export const useCreateSchemeType = schemeTypeHooks.useCreate;
export const useUpdateSchemeType = schemeTypeHooks.useUpdate;
export const useDeleteSchemeType = schemeTypeHooks.useDelete;
