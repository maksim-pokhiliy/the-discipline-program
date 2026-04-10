import { type ApiClient } from "@repo/api-client";
import {
  type AdminBlogPageData,
  type BlogPost,
  BlogToggleField,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/cms/blog";

export const createBlogAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminBlogPageData> => client.request("/api/admin/blog/page-data"),
  getById: (id: string): Promise<BlogPost> => client.request(`/api/admin/blog/${id}`),

  create: (data: CreateBlogPostData): Promise<BlogPost> =>
    client.request("/api/admin/blog", "POST", data),

  update: (id: string, data: UpdateBlogPostData): Promise<BlogPost> =>
    client.request(`/api/admin/blog/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/blog/${id}`, "DELETE"),

  togglePublished: (id: string): Promise<BlogPost> =>
    client.request(`/api/admin/blog/${id}/toggle?field=${BlogToggleField.IS_PUBLISHED}`, "PATCH"),

  toggleFeatured: (id: string): Promise<BlogPost> =>
    client.request(`/api/admin/blog/${id}/toggle?field=${BlogToggleField.IS_FEATURED}`, "PATCH"),
});
