import { adminReviewsApi } from "@repo/api-server";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/auth";
import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

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
