import { type AdminBlogPageData, type AdminBlogPost } from "@repo/contracts/blog";

import { apiClient } from "../client";

export type BlogPayload = Partial<AdminBlogPost> & {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: number | null;
  isPublished?: boolean;
  isFeatured?: boolean;
  coverImage?: string | null;
  publishedAt?: string | null | Date;
};

export const blogAPI = {
  getPageData: (): Promise<AdminBlogPageData> => apiClient.request("/api/admin/blog/page-data"),
  getAll: (): Promise<AdminBlogPost[]> => apiClient.request("/api/admin/blog"),
  getById: (id: string): Promise<AdminBlogPost> => apiClient.request(`/api/admin/blog/${id}`),

  create: (data: Partial<AdminBlogPost>): Promise<AdminBlogPost> =>
    apiClient.request("/api/admin/blog", "POST", data),

  update: (id: string, data: Partial<AdminBlogPost>): Promise<AdminBlogPost> =>
    apiClient.request(`/api/admin/blog/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/blog/${id}`, "DELETE"),

  togglePublished: (id: string): Promise<AdminBlogPost> =>
    apiClient.request(`/api/admin/blog/${id}/toggle?field=isPublished`, "PATCH"),

  toggleFeatured: (id: string): Promise<AdminBlogPost> =>
    apiClient.request(`/api/admin/blog/${id}/toggle?field=isFeatured`, "PATCH"),
};
