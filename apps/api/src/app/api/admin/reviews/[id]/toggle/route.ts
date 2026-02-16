import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";

import { createToggleHandler } from "@app/lib/route-helpers";

export const PATCH = createToggleHandler(
  adminReviewsApi.toggleReviewStatus,
  toggleReviewParamsSchema,
);
