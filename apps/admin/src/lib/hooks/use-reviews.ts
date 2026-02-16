"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type AdminReviewsPageData, type Review } from "@repo/contracts/review";
import { adminKeys } from "@repo/query";

import { api } from "../api";

import { createCrudHooks } from "./create-crud-hooks";

const reviewHooks = createCrudHooks<AdminReviewsPageData, Review, Partial<Review>, Partial<Review>>(
  {
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
  },
);

export const useReviewsPageData = reviewHooks.usePageData;
export const useReview = reviewHooks.useById;
export const useCreateReview = reviewHooks.useCreate;
export const useUpdateReview = reviewHooks.useUpdate;
export const useDeleteReview = reviewHooks.useDelete;

export const useToggleReviewActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.reviews.toggleActive,
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};
