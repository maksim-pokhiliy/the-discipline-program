"use client";

import { BlogPost, BlogStats, AdminBlogPageData } from "@repo/api";

import { apiClient } from "../client";

export const blogAPI = {
  getPageData: (): Promise<AdminBlogPageData> => apiClient.request("/api/blog/page-data"),
  getAll: (): Promise<BlogPost[]> => apiClient.request("/api/blog"),
  getById: (id: string): Promise<BlogPost> => apiClient.request(`/api/blog/${id}`),
  getStats: (): Promise<BlogStats> => apiClient.request("/api/blog/stats"),
  create: (data: Partial<BlogPost>): Promise<BlogPost> =>
    apiClient.request("/api/blog", "POST", data),
  update: (id: string, data: Partial<BlogPost>): Promise<BlogPost> =>
    apiClient.request(`/api/blog/${id}`, "PUT", data),
  delete: (id: string): Promise<void> => apiClient.request(`/api/blog/${id}`, "DELETE"),
  togglePublish: (id: string): Promise<BlogPost> =>
    apiClient.request(`/api/blog/${id}/toggle`, "PATCH", { type: "publish" }),
  toggleFeatured: (id: string): Promise<BlogPost> =>
    apiClient.request(`/api/blog/${id}/toggle`, "PATCH", { type: "featured" }),
};
