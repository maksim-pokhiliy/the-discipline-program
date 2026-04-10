import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import {
  deleteReviewParamsSchema,
  getReviewByIdParamsSchema,
  updateReviewParamsSchema,
  updateReviewRequestSchema,
} from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(cmsReviewAdminApi.getReviewById, getReviewByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    cmsReviewAdminApi.updateReview,
    updateReviewParamsSchema,
    updateReviewRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(cmsReviewAdminApi.deleteReview, deleteReviewParamsSchema),
);
