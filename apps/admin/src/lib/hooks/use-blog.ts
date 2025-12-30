"use client";

import type { AdminBlogPageData, AdminBlogPost } from "@repo/api";
import { adminKeys } from "@repo/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

interface UseBlogPageDataOptions {
  initialData?: AdminBlogPageData;
}

export const useBlogPageData = ({ initialData }: UseBlogPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.blog.page(),
    queryFn: api.blog.getPageData,
    initialData,
  });
};

export const useBlogPost = (id: string) => {
  return useQuery({
    queryKey: adminKeys.blog.byId(id),
    queryFn: () => api.blog.getById(id),
    enabled: !!id,
  });
};

export const useBlogMutations = () => {
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: api.blog.create,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const updatePost = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminBlogPost> }) =>
      api.blog.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const deletePost = useMutation({
    mutationFn: api.blog.delete,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const togglePublished = useMutation({
    mutationFn: api.blog.togglePublished,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: api.blog.toggleFeatured,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const updatePostsOrder = useMutation({
    mutationFn: api.blog.updateOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
    },
  });

  return {
    createPost,
    updatePost,
    deletePost,
    togglePublished,
    toggleFeatured,
    updatePostsOrder,
  };
};
