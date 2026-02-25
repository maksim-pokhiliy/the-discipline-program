import { adminReviewsApi } from "@repo/api-server";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviewsPageData, getReviewsPageDataResponseSchema),
);
