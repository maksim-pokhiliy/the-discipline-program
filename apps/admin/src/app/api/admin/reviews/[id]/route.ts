import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  reviewSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(cmsReviewAdminApi.getReviewById, getReviewByIdParamsSchema, reviewSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsReviewAdminApi.updateReview,
      updateReviewParamsSchema,
      updateReviewRequestSchema,
      reviewSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsReviewAdminApi.deleteReview, deleteReviewParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
