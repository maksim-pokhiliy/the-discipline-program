import { type Review } from "@repo/contracts/review";

import { apiClient } from "../client";

export const reviewsAPI = {
  getAll: (): Promise<Review[]> => apiClient.request("api/public/reviews"),
};
