import { Review } from "@repo/api";

import { apiClient } from "../client";

export const reviewsAPI = {
  getAll: (): Promise<Review[]> => apiClient.request("/api/marketing/reviews"),
};
