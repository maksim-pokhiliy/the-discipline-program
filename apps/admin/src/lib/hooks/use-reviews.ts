"use client";

import {
  type AdminReviewsPageData,
  type Review,
  type CreateReviewData,
  type UpdateReviewData,
} from "@repo/contracts/review";
import { createCrudHooks, createToggleHook } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const reviewHooks = createCrudHooks<
  AdminReviewsPageData,
  Review,
  CreateReviewData,
  UpdateReviewData
>({
  entityName: "Review",
  keys: adminKeys.reviews,
  api: {
    getPageData: api.reviews.getPageData,
    getById: api.reviews.getById,
    create: api.reviews.create,
    update: api.reviews.update,
    delete: api.reviews.delete,
  },
  redirectTo: "/reviews",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useReviewsPageData = reviewHooks.usePageData;
export const useReview = reviewHooks.useById;
export const useCreateReview = reviewHooks.useCreate;
export const useUpdateReview = reviewHooks.useUpdate;
export const useDeleteReview = reviewHooks.useDelete;

export const useToggleReviewActive = createToggleHook({
  mutationFn: api.reviews.toggleActive,
  successMessage: "Review status updated",
  errorMessage: "Failed to update status",
  invalidateKeys: [adminKeys.reviews.page(), adminKeys.dashboard()],
});
