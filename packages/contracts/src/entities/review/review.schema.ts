import { z } from "zod";

import { REVIEW_CONSTANTS } from "./review.constants";

export const reviewSchema = z.object({
  id: z.string().cuid(),
  authorName: z.string().min(1),
  authorRole: z.string().min(1).nullable(),
  authorAvatar: z.string().nullable(),
  text: z.string().min(REVIEW_CONSTANTS.MIN_TEXT_LENGTH).max(REVIEW_CONSTANTS.MAX_TEXT_LENGTH),
  rating: z.number().int().min(REVIEW_CONSTANTS.MIN_RATING).max(REVIEW_CONSTANTS.MAX_RATING),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReviewSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReviewSchema = createReviewSchema.partial();
