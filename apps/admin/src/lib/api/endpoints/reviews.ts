"use client";

import { Review, ReviewStats, AdminReviewsPageData } from "@repo/api";

import { apiClient } from "../client";

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

export const reviewsAPI = {
  getPageData: (): Promise<AdminReviewsPageData> => apiClient.request("/api/reviews/page-data"),

  getAll: (): Promise<Review[]> => apiClient.request("/api/reviews"),

  getById: (id: string): Promise<Review> => apiClient.request(`/api/reviews/${id}`),

  getStats: (): Promise<ReviewStats> => apiClient.request("/api/reviews/stats"),

  create: (data: Partial<Review>): Promise<Review> =>
    apiClient.request("/api/reviews", "POST", data),

  update: (id: string, data: Partial<Review>): Promise<Review> =>
    apiClient.request(`/api/reviews/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/reviews/${id}`, "DELETE"),

  toggleActive: (id: string): Promise<Review> =>
    apiClient.request(`/api/reviews/${id}/toggle?field=isActive`, "PATCH"),

  toggleFeatured: (id: string): Promise<Review> =>
    apiClient.request(`/api/reviews/${id}/toggle?field=isFeatured`, "PATCH"),

  updateOrder: (updates: SortOrderUpdate[]): Promise<{ success: true }> =>
    apiClient.request("/api/reviews/order", "PATCH", { updates }),
};
