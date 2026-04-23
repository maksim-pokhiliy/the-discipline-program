"use client";

import { useQuery } from "@tanstack/react-query";

import type { CreateSchemeData, Scheme, UpdateSchemeData } from "@repo/contracts/library/scheme";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const librarySchemeHooks = createCrudHooks<Scheme[], Scheme, CreateSchemeData, UpdateSchemeData>({
  entityName: "Scheme",
  keys: adminKeys.librarySchemes,
  api: {
    getPageData: () => api.librarySchemes.list({ includeInactive: true }),
    getById: api.librarySchemes.getById,
    create: api.librarySchemes.create,
    update: api.librarySchemes.update,
    delete: api.librarySchemes.delete,
  },
  redirectTo: "/library/schemes",
  useNavigate,
});

export const useLibrarySchemes = librarySchemeHooks.usePageData;
export const useLibraryScheme = librarySchemeHooks.useById;
export const useCreateLibraryScheme = librarySchemeHooks.useCreate;
export const useUpdateLibraryScheme = librarySchemeHooks.useUpdate;
export const useDeleteLibraryScheme = librarySchemeHooks.useDelete;

export const useActiveLibrarySchemes = () =>
  useQuery({
    queryKey: [...adminKeys.librarySchemes.page(), "active"] as const,
    queryFn: () => api.librarySchemes.list({ includeInactive: false }),
  });
