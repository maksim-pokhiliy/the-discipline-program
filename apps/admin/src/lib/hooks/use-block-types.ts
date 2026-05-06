"use client";

import {
  type AdminBlockTypesPageData,
  type BlockType,
  type CreateBlockTypeData,
  type UpdateBlockTypeData,
} from "@repo/contracts/lms/block-type";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const blockTypeHooks = createCrudHooks<
  AdminBlockTypesPageData,
  BlockType,
  CreateBlockTypeData,
  UpdateBlockTypeData
>({
  entityName: "BlockType",
  keys: adminKeys.blockTypes,
  api: {
    getPageData: api.blockTypes.getPageData,
    getById: api.blockTypes.getById,
    create: api.blockTypes.create,
    update: api.blockTypes.update,
    delete: api.blockTypes.delete,
  },
  redirectTo: "/block-types",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useBlockTypesPageData = blockTypeHooks.usePageData;
export const useBlockType = blockTypeHooks.useById;
export const useCreateBlockType = blockTypeHooks.useCreate;
export const useUpdateBlockType = blockTypeHooks.useUpdate;
export const useDeleteBlockType = blockTypeHooks.useDelete;
