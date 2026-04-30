import { type ApiClient } from "@repo/api-client";
import {
  type Review,
  type AdminReviewsPageData,
  type CreateReviewData,
  type UpdateReviewData,
} from "@repo/contracts/cms/review";

export const createReviewsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminReviewsPageData> => client.request("/api/admin/reviews/page-data"),

  getById: (id: string): Promise<Review> => client.request(`/api/admin/reviews/${id}`),

  create: (data: CreateReviewData): Promise<Review> =>
    client.request("/api/admin/reviews", "POST", data),

  update: (id: string, data: UpdateReviewData): Promise<Review> =>
    client.request(`/api/admin/reviews/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/reviews/${id}`, "DELETE"),

  toggleActive: (id: string): Promise<Review> =>
    client.request(`/api/admin/reviews/${id}/toggle`, "PATCH"),
});
