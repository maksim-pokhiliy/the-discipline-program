"use client";

import type { AdminReviewsPageData, Review } from "@repo/api";
import { adminKeys } from "@repo/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

interface UseReviewsPageDataOptions {
  initialData?: AdminReviewsPageData;
}

export const useReviewsPageData = ({ initialData }: UseReviewsPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.reviews.page(),
    queryFn: api.reviews.getPageData,
    initialData,
  });
};

export const useReview = (id: string) => {
  return useQuery({
    queryKey: adminKeys.reviews.byId(id),
    queryFn: () => api.reviews.getById(id),
    enabled: !!id,
  });
};

export const useReviewMutations = () => {
  const queryClient = useQueryClient();

  const createReview = useMutation({
    mutationFn: api.reviews.create,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Review> }) =>
      api.reviews.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const deleteReview = useMutation({
    mutationFn: api.reviews.delete,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const toggleActive = useMutation({
    mutationFn: api.reviews.toggleActive,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: api.reviews.toggleFeatured,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const updateReviewsOrder = useMutation({
    mutationFn: api.reviews.updateOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
    },
  });

  return {
    createReview,
    updateReview,
    deleteReview,
    toggleActive,
    toggleFeatured,
    updateReviewsOrder,
  };
};
