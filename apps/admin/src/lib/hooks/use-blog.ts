"use client";

import { BlogPost, AdminBlogPageData } from "@repo/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

export const useBlogPageData = () =>
  useQuery({
    queryKey: ["admin", "blog", "page-data"],
    queryFn: api.blog.getPageData,
  });

export const useBlogs = () =>
  useQuery({
    queryKey: ["admin", "blog"],
    queryFn: api.blog.getAll,
  });

export const useBlogStats = () =>
  useQuery({
    queryKey: ["admin", "blog", "stats"],
    queryFn: api.blog.getStats,
  });

export const useBlog = (id: string) =>
  useQuery({
    queryKey: ["admin", "blog", id],
    queryFn: () => api.blog.getById(id),
    enabled: !!id,
  });

export const useBlogMutations = () => {
  const queryClient = useQueryClient();

  const invalidateBlog = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const createPost = useMutation({
    mutationFn: api.blog.create,
    onSuccess: invalidateBlog,
  });

  const updatePost = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) =>
      api.blog.update(id, data),
    onSuccess: invalidateBlog,
  });

  const deletePost = useMutation({
    mutationFn: api.blog.delete,
    onSuccess: invalidateBlog,
  });

  const togglePublish = useMutation({
    mutationFn: api.blog.togglePublish,
    onSuccess: invalidateBlog,
  });

  const toggleFeatured = useMutation({
    mutationFn: api.blog.toggleFeatured,
    onSuccess: invalidateBlog,
  });

  const updatePostsOrder = useMutation({
    mutationFn: async (reorderedPosts: BlogPost[]) => {
      const updates = reorderedPosts.map((post, index) => ({
        id: post.id,
        sortOrder: index + 1,
      }));

      await Promise.all(
        updates.map((update) => api.blog.update(update.id, { sortOrder: update.sortOrder })),
      );

      return reorderedPosts;
    },

    onMutate: async (reorderedPosts: BlogPost[]) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "blog"] });

      const previousPageData = queryClient.getQueryData<AdminBlogPageData>([
        "admin",
        "blog",
        "page-data",
      ]);

      const previousPosts = queryClient.getQueryData<BlogPost[]>(["admin", "blog"]);

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

      queryClient.setQueryData<BlogPost[]>(["admin", "blog"], updatedPosts);

      return { previousPageData, previousPosts };
    },

    onError: (error, _, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(["admin", "blog", "page-data"], context.previousPageData);
      }

      if (context?.previousPosts) {
        queryClient.setQueryData(["admin", "blog"], context.previousPosts);
      }

      console.error("Failed to update posts order:", error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return {
    createPost,
    updatePost,
    deletePost,
    togglePublish,
    toggleFeatured,
    updatePostsOrder,
  };
};
