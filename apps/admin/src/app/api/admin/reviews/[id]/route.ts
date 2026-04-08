import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { adminReviewsApi } from "@repo/api-server";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/server/auth";

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
