import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminReviewsApi } from "@repo/api-server";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/review";

export const GET = withAdminAuth(
  createGetByIdHandler(adminReviewsApi.getReviewById, getReviewByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    adminReviewsApi.updateReview,
    updateReviewParamsSchema,
    updateReviewRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminReviewsApi.deleteReview, deleteReviewParamsSchema),
);
