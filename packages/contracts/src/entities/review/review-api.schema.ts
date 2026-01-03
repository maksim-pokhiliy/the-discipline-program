import { z } from "zod";

import { TOGGLE_FIELDS } from "./review.constants";
import { createReviewSchema, updateReviewSchema, updateReviewsOrderSchema } from "./review.schema";

export const getReviewsResponseSchema = z.array(
  z
    .object({
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
    })
    .strict(),
);

export const getReviewByIdParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const createReviewRequestSchema = createReviewSchema;

export const updateReviewParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const updateReviewRequestSchema = updateReviewSchema;

export const deleteReviewParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const toggleReviewParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const toggleReviewQuerySchema = z
  .object({
    field: z.enum(TOGGLE_FIELDS),
  })
  .strict();

export const updateReviewsOrderRequestSchema = updateReviewsOrderSchema;

export const getReviewsPageDataResponseSchema = z
  .object({
    stats: z
      .object({
        total: z.number(),
        active: z.number(),
        featured: z.number(),
      })
      .strict(),
    reviews: getReviewsResponseSchema,
  })
  .strict();
