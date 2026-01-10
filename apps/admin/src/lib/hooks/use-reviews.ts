"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AdminReviewsPageData, Review } from "@repo/contracts/review";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseReviewsPageDataOptions {
  initialData?: AdminReviewsPageData;
}

export const useReviewsPageData = ({ initialData }: UseReviewsPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.reviews.page(),
    queryFn: api.reviews.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
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

  return {
    createReview,
    updateReview,
    deleteReview,
    toggleActive,
    toggleFeatured,
  };
};
