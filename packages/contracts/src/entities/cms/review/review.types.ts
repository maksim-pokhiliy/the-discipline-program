import { type z } from "zod";

import {
  type reviewSchema,
  type createReviewSchema,
  type updateReviewSchema,
} from "./review.schema";

export type Review = z.infer<typeof reviewSchema>;

export type CreateReviewData = z.infer<typeof createReviewSchema>;

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;
