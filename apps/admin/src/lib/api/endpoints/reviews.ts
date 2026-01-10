import { type Review, type ReviewStats, type AdminReviewsPageData } from "@repo/contracts/review";

import { apiClient } from "../client";

export const reviewsAPI = {
  getPageData: (): Promise<AdminReviewsPageData> =>
    apiClient.request("/api/admin/reviews/page-data"),

  getAll: (): Promise<Review[]> => apiClient.request("/api/admin/reviews"),

  getById: (id: string): Promise<Review> => apiClient.request(`/api/admin/reviews/${id}`),

  getStats: (): Promise<ReviewStats> => apiClient.request("/api/admin/reviews/stats"),

  create: (data: Partial<Review>): Promise<Review> =>
    apiClient.request("/api/admin/reviews", "POST", data),

  update: (id: string, data: Partial<Review>): Promise<Review> =>
    apiClient.request(`/api/admin/reviews/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/reviews/${id}`, "DELETE"),

  toggleActive: (id: string): Promise<Review> =>
    apiClient.request(`/api/admin/reviews/${id}/toggle?field=isActive`, "PATCH"),

  toggleFeatured: (id: string): Promise<Review> =>
    apiClient.request(`/api/admin/reviews/${id}/toggle?field=isFeatured`, "PATCH"),
};
