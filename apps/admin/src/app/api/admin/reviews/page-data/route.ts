import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminReviewsApi } from "@repo/api-server";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/review";

export const GET = withAdminAuth(
  createGetHandler(adminReviewsApi.getReviewsPageData, getReviewsPageDataResponseSchema),
);
