"use client";

import type { AdminReviewsPageData, Review } from "@repo/api";
import { adminKeys, createPageDataCrudHooks } from "@repo/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

const reviews = createPageDataCrudHooks<AdminReviewsPageData, Review, "reviews", "stats">({
  keys: {
    page: adminKeys.reviews.page,
    byId: adminKeys.reviews.byId,
    invalidate: () => [adminKeys.dashboard()],
  },

  api: {
    getPageData: api.reviews.getPageData,
    getById: api.reviews.getById,
    create: api.reviews.create,
    update: api.reviews.update,
    delete: api.reviews.delete,
    toggle: api.reviews.toggleActive,
    updateOrder: api.reviews.updateOrder,
  },

  fields: {
    items: "reviews",
    stats: "stats",
  },
});

export const useReviewsPageData = reviews.usePageData;
export const useReviews = reviews.useItems;
export const useReviewsStats = reviews.useStats;
export const useReview = reviews.useById;

export const useReviewMutations = () => {
  const queryClient = useQueryClient();

  const { createItem, updateItem, deleteItem, toggleItem, updateOrder } = reviews.useMutations();

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => api.reviews.toggleFeatured(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  return {
    createReview: createItem,
    updateReview: updateItem,
    deleteReview: deleteItem,
    toggleActive: toggleItem,
    toggleFeatured,
    updateReviewsOrder: updateOrder,
  };
};
