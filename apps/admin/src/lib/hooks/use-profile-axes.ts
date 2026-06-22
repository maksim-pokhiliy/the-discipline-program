"use client";

import {
  type AdminProfileAxesPageData,
  type CreateProfileAxisData,
  type ProfileAxis,
  type UpdateProfileAxisData,
} from "@repo/contracts/coaching/profile-axis";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const profileAxisHooks = createCrudHooks<
  AdminProfileAxesPageData,
  ProfileAxis,
  CreateProfileAxisData,
  UpdateProfileAxisData
>({
  entityName: "Profile axis",
  keys: adminKeys.profileAxes,
  api: {
    getPageData: api.profileAxes.getPageData,
    getById: api.profileAxes.getById,
    create: api.profileAxes.create,
    update: api.profileAxes.update,
    delete: api.profileAxes.delete,
  },
  redirectTo: "/profile-axes",
  useNavigate,
});

export const useProfileAxesPageData = profileAxisHooks.usePageData;
export const useProfileAxis = profileAxisHooks.useById;
export const useCreateProfileAxis = profileAxisHooks.useCreate;
export const useUpdateProfileAxis = profileAxisHooks.useUpdate;
export const useDeleteProfileAxis = profileAxisHooks.useDelete;
