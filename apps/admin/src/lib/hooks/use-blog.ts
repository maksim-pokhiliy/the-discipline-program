"use client";

import {
  type AdminBlogPageData,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
import { adminKeys, createCrudHooks, createToggleHook } from "@repo/query";

import { api } from "../api";

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
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useBlogPageData = blogHooks.usePageData;
export const useBlogPost = blogHooks.useById;
export const useCreateBlogPost = blogHooks.useCreate;
export const useUpdateBlogPost = blogHooks.useUpdate;
export const useDeleteBlogPost = blogHooks.useDelete;

export const useToggleBlogPost = createToggleHook({
  mutationFn: api.blog.togglePublished,
  successMessage: "Post status updated",
  errorMessage: "Failed to update post status",
  invalidateKeys: [adminKeys.blog.page(), adminKeys.dashboard()],
});

export const useToggleBlogFeatured = createToggleHook({
  mutationFn: api.blog.toggleFeatured,
  successMessage: "Featured post updated",
  errorMessage: "Failed to update featured post",
  invalidateKeys: [adminKeys.blog.page(), adminKeys.dashboard()],
});
