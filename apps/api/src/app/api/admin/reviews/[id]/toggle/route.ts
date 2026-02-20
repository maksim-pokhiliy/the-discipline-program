import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";

import { withAdminAuth } from "@app/lib/auth";
import { createToggleHandler } from "@app/lib/route-helpers";

export const PATCH = withAdminAuth(
  createToggleHandler(adminReviewsApi.toggleReviewStatus, toggleReviewParamsSchema),
);
