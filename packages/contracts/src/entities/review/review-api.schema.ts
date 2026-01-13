import { z } from "zod";

import { TOGGLE_FIELDS } from "./review.constants";
import { createReviewSchema, updateReviewSchema } from "./review.schema";

export const getReviewsResponseSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    authorName: z.string(),
    authorRole: z.string().nullable(),
    authorAvatar: z.string().nullable(),
    rating: z.number(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

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
  field: z.enum(TOGGLE_FIELDS),
});

export const getReviewsPageDataResponseSchema = z.object({
  stats: z.object({
    total: z.number(),
    active: z.number(),
    featured: z.number(),
  }),
  reviews: getReviewsResponseSchema,
});
