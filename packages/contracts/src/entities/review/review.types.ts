import { z } from "zod";
import {
  reviewSchema,
  createReviewSchema,
  updateReviewSchema,
  updateReviewOrderSchema,
} from "./review.schema";

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewData = z.infer<typeof createReviewSchema>;
export type UpdateReviewData = z.infer<typeof updateReviewSchema>;
export type UpdateReviewOrder = z.infer<typeof updateReviewOrderSchema>;

export interface ReviewStats {
  total: number;
  active: number;
  featured: number;
}

export interface AdminReviewsPageData {
  stats: ReviewStats;
  reviews: Review[];
}
