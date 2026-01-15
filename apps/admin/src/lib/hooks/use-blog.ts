"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type AdminBlogPageData } from "@repo/contracts/blog";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseBlogPageDataOptions {
  initialData?: AdminBlogPageData;
}

export const useBlogPageData = ({ initialData }: UseBlogPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.blog.page(),
    queryFn: api.blog.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useToggleBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.blog.togglePublished,
    onSuccess: () => {
      toast.success("Post status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: () => {
      toast.error("Failed to update post status");
    },
  });
};

export const useToggleBlogFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.blog.toggleFeatured,
    onSuccess: () => {
      toast.success("Featured post updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: () => {
      toast.error("Failed to update featured post");
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.blog.delete,
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });
};
