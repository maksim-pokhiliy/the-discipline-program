import { adminReviewsApi } from "@repo/api-server";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/review";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(
  adminReviewsApi.getReviewsPageData,
  getReviewsPageDataResponseSchema,
);
