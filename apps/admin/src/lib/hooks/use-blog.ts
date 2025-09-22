"use client";

import { AdminBlogPageData, AdminBlogPost } from "@repo/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { BlogPayload } from "../api/endpoints/blog";

export const useBlogPageData = () =>
  useQuery({
    queryKey: ["admin", "blog", "page-data"],
    queryFn: api.blog.getPageData,
  });

export const useBlogPosts = () =>
  useQuery({
    queryKey: ["admin", "blog"],
    queryFn: api.blog.getAll,
  });

export const useBlogStats = () =>
  useQuery({
    queryKey: ["admin", "blog", "stats"],
    queryFn: api.blog.getStats,
  });

export const useBlogPost = (id: string) =>
  useQuery({
    queryKey: ["admin", "blog", id],
    queryFn: () => api.blog.getById(id),
    enabled: !!id,
  });

export const useBlogMutations = () => {
  const queryClient = useQueryClient();

  const invalidateBlog = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "blog", "page-data"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "blog", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const createPost = useMutation({
    mutationFn: api.blog.create,
    onSuccess: invalidateBlog,
  });

  const updatePost = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BlogPayload }) => api.blog.update(id, data),
    onSuccess: invalidateBlog,
  });

  const deletePost = useMutation({
    mutationFn: api.blog.delete,
    onSuccess: invalidateBlog,
  });

  const togglePublished = useMutation({
    mutationFn: api.blog.togglePublished,
    onSuccess: invalidateBlog,
  });

  const toggleFeatured = useMutation({
    mutationFn: api.blog.toggleFeatured,
    onSuccess: invalidateBlog,
  });

  const updatePostsOrder = useMutation({
    mutationFn: async (reorderedPosts: AdminBlogPost[]) => {
      const updates = reorderedPosts.map((post, index) => ({
        id: post.id,
        sortOrder: index + 1,
      }));

      return api.blog.updateOrder(updates);
    },

    onMutate: async (reorderedPosts: AdminBlogPost[]) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "blog"] });

      const previousPageData = queryClient.getQueryData<AdminBlogPageData>([
        "admin",
        "blog",
        "page-data",
      ]);

      const previousPosts = queryClient.getQueryData<AdminBlogPost[]>(["admin", "blog"]);

      const updatedPosts = reorderedPosts.map((post, index) => ({
        ...post,
        sortOrder: index + 1,
      }));

      queryClient.setQueryData<AdminBlogPageData>(["admin", "blog", "page-data"], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          posts: updatedPosts,
        };
      });

      queryClient.setQueryData<AdminBlogPost[]>(["admin", "blog"], updatedPosts);

      return { previousPageData, previousPosts };
    },

    onError: (error, _, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(["admin", "blog", "page-data"], context.previousPageData);
      }

      if (context?.previousPosts) {
        queryClient.setQueryData(["admin", "blog"], context.previousPosts);
      }

      console.error("Failed to update blog order:", error);
    },

    onSettled: () => {
      invalidateBlog();
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
