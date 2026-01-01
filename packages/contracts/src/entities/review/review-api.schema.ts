import { z } from "zod";
import { createReviewSchema, updateReviewSchema, updateReviewsOrderSchema } from "./review.schema";

export const getReviewsResponseSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    authorName: z.string(),
    authorRole: z.string(),
    authorAvatar: z.string().nullable(),
    rating: z.number(),
    programId: z.string().nullable(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.number(),
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
  field: z.enum(["isActive", "isFeatured"]),
});

export const updateReviewsOrderRequestSchema = updateReviewsOrderSchema;

export const getReviewsPageDataResponseSchema = z.object({
  stats: z.object({
    total: z.number(),
    active: z.number(),
    featured: z.number(),
  }),
  reviews: getReviewsResponseSchema,
});
