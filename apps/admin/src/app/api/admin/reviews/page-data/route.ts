import { createGetHandler } from "@repo/api-routes";
import { adminReviewsApi } from "@repo/api-server";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviewsPageData, getReviewsPageDataResponseSchema),
);
