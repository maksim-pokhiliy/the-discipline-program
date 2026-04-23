"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  BlockType,
  CreateBlockTypeData,
  UpdateBlockTypeData,
} from "@repo/contracts/library/block-type";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const libraryBlockTypeHooks = createCrudHooks<
  BlockType[],
  BlockType,
  CreateBlockTypeData,
  UpdateBlockTypeData
>({
  entityName: "Block type",
  keys: adminKeys.libraryBlockTypes,
  api: {
    getPageData: () => api.libraryBlockTypes.list({ includeInactive: true }),
    getById: api.libraryBlockTypes.getById,
    create: api.libraryBlockTypes.create,
    update: api.libraryBlockTypes.update,
    delete: api.libraryBlockTypes.delete,
  },
  redirectTo: "/library/block-types",
  useNavigate,
});

export const useLibraryBlockTypes = libraryBlockTypeHooks.usePageData;
export const useLibraryBlockType = libraryBlockTypeHooks.useById;
export const useCreateLibraryBlockType = libraryBlockTypeHooks.useCreate;
export const useUpdateLibraryBlockType = libraryBlockTypeHooks.useUpdate;
export const useDeleteLibraryBlockType = libraryBlockTypeHooks.useDelete;

export const useActiveLibraryBlockTypes = () =>
  useQuery({
    queryKey: [...adminKeys.libraryBlockTypes.page(), "active"] as const,
    queryFn: () => api.libraryBlockTypes.list({ includeInactive: false }),
  });
