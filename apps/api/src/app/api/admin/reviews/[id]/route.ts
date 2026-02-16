import { adminReviewsApi } from "@repo/api-server";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/review";

import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(adminReviewsApi.getReviewById, getReviewByIdParamsSchema);
export const PUT = createPutHandler(
  adminReviewsApi.updateReview,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
);
export const DELETE = createDeleteHandler(adminReviewsApi.deleteReview, deleteReviewParamsSchema);
