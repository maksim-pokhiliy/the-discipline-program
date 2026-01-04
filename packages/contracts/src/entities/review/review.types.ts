import { type z } from "zod";

import { type getReviewsPageDataResponseSchema } from "./review-api.schema";
import {
  type reviewSchema,
  type createReviewSchema,
  type updateReviewSchema,
  type updateReviewOrderSchema,
} from "./review.schema";

export type Review = z.infer<typeof reviewSchema>;

export type CreateReviewData = z.infer<typeof createReviewSchema>;

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;

export type UpdateReviewOrder = z.infer<typeof updateReviewOrderSchema>;

export type AdminReviewsPageData = z.infer<typeof getReviewsPageDataResponseSchema>;

export type ReviewStats = AdminReviewsPageData["stats"];
