import { createToggleHandler } from "@repo/api-routes";
import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/auth";

export const PATCH = withAdminAuth(
  createToggleHandler(adminReviewsApi.toggleReviewStatus, toggleReviewParamsSchema),
);
