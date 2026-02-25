import { type ApiClient } from "@repo/api-client";
import { type Review, type AdminReviewsPageData } from "@repo/contracts/review";

export const createReviewsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminReviewsPageData> => client.request("/api/admin/reviews/page-data"),

  getAll: (): Promise<Review[]> => client.request("/api/admin/reviews"),

  getById: (id: string): Promise<Review> => client.request(`/api/admin/reviews/${id}`),

  create: (data: Partial<Review>): Promise<Review> =>
    client.request("/api/admin/reviews", "POST", data),

  update: (id: string, data: Partial<Review>): Promise<Review> =>
    client.request(`/api/admin/reviews/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/reviews/${id}`, "DELETE"),

  toggleActive: (id: string): Promise<Review> =>
    client.request(`/api/admin/reviews/${id}/toggle?field=isActive`, "PATCH"),
});
