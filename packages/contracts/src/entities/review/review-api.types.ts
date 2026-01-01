import { z } from "zod";
import {
  getReviewsResponseSchema,
  getReviewByIdParamsSchema,
  createReviewRequestSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
  deleteReviewParamsSchema,
  toggleReviewParamsSchema,
  toggleReviewQuerySchema,
  updateReviewsOrderRequestSchema,
  getReviewsPageDataResponseSchema,
} from "./review-api.schema";

export type GetReviewsResponse = z.infer<typeof getReviewsResponseSchema>;
export type GetReviewByIdParams = z.infer<typeof getReviewByIdParamsSchema>;
export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;
export type UpdateReviewParams = z.infer<typeof updateReviewParamsSchema>;
export type UpdateReviewRequest = z.infer<typeof updateReviewRequestSchema>;
export type DeleteReviewParams = z.infer<typeof deleteReviewParamsSchema>;
export type ToggleReviewParams = z.infer<typeof toggleReviewParamsSchema>;
export type ToggleReviewQuery = z.infer<typeof toggleReviewQuerySchema>;
export type UpdateReviewsOrderRequest = z.infer<typeof updateReviewsOrderRequestSchema>;
export type GetReviewsPageDataResponse = z.infer<typeof getReviewsPageDataResponseSchema>;
