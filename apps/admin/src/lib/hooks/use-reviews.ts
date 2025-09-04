"use client";

import { Review, AdminReviewsPageData } from "@repo/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api";

export const useReviewsPageData = () =>
  useQuery({
    queryKey: ["admin", "reviews", "page-data"],
    queryFn: adminApi.reviews.getPageData,
  });

export const useReviews = () =>
  useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: adminApi.reviews.getAll,
  });

export const useReviewsStats = () =>
  useQuery({
    queryKey: ["admin", "reviews", "stats"],
    queryFn: adminApi.reviews.getStats,
  });

export const useReview = (id: string) =>
  useQuery({
    queryKey: ["admin", "reviews", id],
    queryFn: () => adminApi.reviews.getById(id),
    enabled: !!id,
  });

export const useReviewMutations = () => {
  const queryClient = useQueryClient();

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const createReview = useMutation({
    mutationFn: adminApi.reviews.create,
    onSuccess: invalidateReviews,
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Review> }) =>
      adminApi.reviews.update(id, data),
    onSuccess: invalidateReviews,
  });

  const deleteReview = useMutation({
    mutationFn: adminApi.reviews.delete,
    onSuccess: invalidateReviews,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.reviews.update(id, { isActive: !isActive }),
    onSuccess: invalidateReviews,
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminApi.reviews.update(id, { isFeatured: !isFeatured }),
    onSuccess: invalidateReviews,
  });

  const updateReviewsOrder = useMutation({
    mutationFn: async (reorderedReviews: Review[]) => {
      const updates = reorderedReviews.map((review, index) => ({
        id: review.id,
        sortOrder: index + 1,
      }));

      await Promise.all(
        updates.map((update) =>
          adminApi.reviews.update(update.id, { sortOrder: update.sortOrder }),
        ),
      );

      return reorderedReviews;
    },

    onMutate: async (reorderedReviews: Review[]) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reviews"] });

      const previousPageData = queryClient.getQueryData<AdminReviewsPageData>([
        "admin",
        "reviews",
        "page-data",
      ]);

      const previousReviews = queryClient.getQueryData<Review[]>(["admin", "reviews"]);

      const updatedReviews = reorderedReviews.map((review, index) => ({
        ...review,
        sortOrder: index + 1,
      }));

      queryClient.setQueryData<AdminReviewsPageData>(
        ["admin", "reviews", "page-data"],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            reviews: updatedReviews,
          };
        },
      );

      queryClient.setQueryData<Review[]>(["admin", "reviews"], updatedReviews);

      return { previousPageData, previousReviews };
    },

    onError: (error, _, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(["admin", "reviews", "page-data"], context.previousPageData);
      }

      if (context?.previousReviews) {
        queryClient.setQueryData(["admin", "reviews"], context.previousReviews);
      }

      console.error("Failed to update reviews order:", error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
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
