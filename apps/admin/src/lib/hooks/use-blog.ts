"use client";

import type { AdminBlogPageData, AdminBlogPost } from "@repo/api";
import { adminKeys, createPageDataCrudHooks } from "@repo/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

const blog = createPageDataCrudHooks<AdminBlogPageData, AdminBlogPost, "posts", "stats">({
  keys: {
    page: adminKeys.blog.page,
    byId: adminKeys.blog.byId,
    invalidate: () => [adminKeys.dashboard()],
  },

  api: {
    getPageData: api.blog.getPageData,
    getById: api.blog.getById,
    create: api.blog.create,
    update: api.blog.update,
    delete: api.blog.delete,
    updateOrder: api.blog.updateOrder,
  },

  fields: {
    items: "posts",
    stats: "stats",
  },
});

export const useBlogPageData = blog.usePageData;
export const useBlogPosts = blog.useItems;
export const useBlogStats = blog.useStats;

export const useBlogMutations = () => {
  const queryClient = useQueryClient();

  const { createItem, updateItem, deleteItem, updateOrder } = blog.useMutations();

  const togglePublished = useMutation({
    mutationFn: (id: string) => api.blog.togglePublished(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => api.blog.toggleFeatured(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });

  return {
    createPost: createItem,
    updatePost: updateItem,
    deletePost: deleteItem,
    updatePostsOrder: updateOrder,
    togglePublished,
    toggleFeatured,
  };
};
