"use client";

import { AdminBlogPageData } from "@repo/api";

import { apiClient } from "../client";

export const blogAPI = {
  getPageData: (): Promise<AdminBlogPageData> => apiClient.request("/api/blog/page-data"),
  // getAll: (): Promise<Review[]> => apiClient.request("/api/reviews"),
  // getById: (id: string): Promise<Review> => apiClient.request(`/api/reviews/${id}`),
  // getStats: (): Promise<ReviewStats> => apiClient.request("/api/reviews/stats"),
  // create: (data: Partial<Review>): Promise<Review> =>
  //   apiClient.request("/api/reviews", "POST", data),
  // update: (id: string, data: Partial<Review>): Promise<Review> =>
  //   apiClient.request(`/api/reviews/${id}`, "PUT", data),
  // delete: (id: string): Promise<void> => apiClient.request(`/api/reviews/${id}`, "DELETE"),
};
