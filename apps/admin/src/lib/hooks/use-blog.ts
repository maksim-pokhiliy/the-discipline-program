"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type AdminBlogPageData,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
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

export const useBlogPost = (id: string, initialData?: BlogPost) => {
  return useQuery({
    queryKey: adminKeys.blog.byId(id),
    queryFn: () => api.blog.getById(id),
    initialData,
    enabled: !!id,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateBlogPostData) => api.blog.create(data),
    onSuccess: () => {
      toast.success("Blog post created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      router.push("/blog");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create blog post");
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogPostData }) =>
      api.blog.update(id, data),
    onSuccess: (data) => {
      toast.success("Blog post updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.blog.byId(data.id) });
      router.push("/blog");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update blog post");
    },
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
