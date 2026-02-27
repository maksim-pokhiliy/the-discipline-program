import { type ApiClient } from "@repo/api-client";
import { type Review } from "@repo/contracts/review";

export const createReviewsAPI = (client: ApiClient) => ({
  getAll: (): Promise<Review[]> => client.request("/api/public/reviews"),
});
