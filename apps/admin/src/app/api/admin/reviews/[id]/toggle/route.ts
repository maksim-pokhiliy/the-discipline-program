import { createToggleHandler } from "@repo/api-routes";
import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  createToggleHandler(adminReviewsApi.toggleReviewStatus, toggleReviewParamsSchema),
);
