"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { type AdminReviewsPageData, type Review } from "@repo/contracts/review";
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

export const useReview = (id: string, initialData?: Review) => {
  return useQuery({
    queryKey: adminKeys.reviews.byId(id),
    queryFn: () => api.reviews.getById(id),
    initialData,
    enabled: !!id,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.reviews.create,
    onSuccess: () => {
      toast.success("Review created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/reviews");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create review");
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Review> }) =>
      api.reviews.update(id, data),
    onSuccess: (data) => {
      toast.success("Review updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      router.push("/reviews");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update review");
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.reviews.delete,
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
};

export const useToggleReviewActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.reviews.toggleActive,
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
};
