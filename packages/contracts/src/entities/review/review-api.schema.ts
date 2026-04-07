import { z } from "zod";

import { ReviewToggleField } from "./review.constants";
import { createReviewSchema, reviewSchema, updateReviewSchema } from "./review.schema";

export const getReviewsResponseSchema = z.array(reviewSchema);

export const getReviewByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createReviewRequestSchema = createReviewSchema;

export const updateReviewParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateReviewRequestSchema = updateReviewSchema;

export const deleteReviewParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleReviewParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleReviewQuerySchema = z.object({
  field: z.nativeEnum(ReviewToggleField),
});

export const getReviewsPageDataResponseSchema = z.object({
  reviews: getReviewsResponseSchema,
});
