import {
  type AdminBlogPageData,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";

import { apiClient } from "../client";

export const blogAPI = {
  getPageData: (): Promise<AdminBlogPageData> => apiClient.request("/api/admin/blog/page-data"),
  getAll: (): Promise<BlogPost[]> => apiClient.request("/api/admin/blog"),
  getById: (id: string): Promise<BlogPost> => apiClient.request(`/api/admin/blog/${id}`),

  create: (data: CreateBlogPostData): Promise<BlogPost> =>
    apiClient.request("/api/admin/blog", "POST", data),

  update: (id: string, data: UpdateBlogPostData): Promise<BlogPost> =>
    apiClient.request(`/api/admin/blog/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/blog/${id}`, "DELETE"),

  togglePublished: (id: string): Promise<BlogPost> =>
    apiClient.request(`/api/admin/blog/${id}/toggle?field=isPublished`, "PATCH"),

  toggleFeatured: (id: string): Promise<BlogPost> =>
    apiClient.request(`/api/admin/blog/${id}/toggle?field=isFeatured`, "PATCH"),
};
