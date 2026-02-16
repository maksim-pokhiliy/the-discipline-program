"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type AdminBlogPageData,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
import { adminKeys } from "@repo/query";

import { api } from "../api";

import { createCrudHooks } from "./create-crud-hooks";

const blogHooks = createCrudHooks<
  AdminBlogPageData,
  BlogPost,
  CreateBlogPostData,
  UpdateBlogPostData
>({
  entityName: "Blog post",
  keys: adminKeys.blog,
  api: {
    getPageData: api.blog.getPageData,
    getById: api.blog.getById,
    create: api.blog.create,
    update: api.blog.update,
    delete: api.blog.delete,
  },
  redirectTo: "/blog",
});

export const useBlogPageData = blogHooks.usePageData;
export const useBlogPost = blogHooks.useById;
export const useCreateBlogPost = blogHooks.useCreate;
export const useUpdateBlogPost = blogHooks.useUpdate;
export const useDeleteBlogPost = blogHooks.useDelete;

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
