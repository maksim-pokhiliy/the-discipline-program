import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createReviewSchema, reviewSchema, updateReviewSchema } from "./review.schema";

export const getReviewsResponseSchema = z.array(reviewSchema);

export const getReviewByIdParamsSchema = idParamSchema;

export const createReviewRequestSchema = createReviewSchema;

export const updateReviewParamsSchema = idParamSchema;

export const updateReviewRequestSchema = updateReviewSchema;

export const deleteReviewParamsSchema = idParamSchema;

export const toggleReviewParamsSchema = idParamSchema;

export const getReviewsPageDataResponseSchema = z.object({
  reviews: getReviewsResponseSchema,
});
